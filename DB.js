const Realm = require('realm');

import Message from './models/Message';
import Configuration from './models/Configuration';
import Contact from './models/Contact';

const PATH = 'com.jeromecornet.voipms.realm';
const URL = "https://voip.ms/api/v1/rest.php"
var moment = require('moment');

const CONFIGURATION_KEYS = ['username', 'password', 'did', 'registration_token', 'ignored_did']

export default class DB {

  constructor() {
    realm = new Realm({path: PATH, schema: [Message, Configuration, Contact]});
    //this.clearLocalMessageCache();
    //this.seedDB()
  }

  registerCallback(callback) {
    realm.addListener('change', callback);
  }

  unregisterCallback(callback) {
    realm.removeListener('change', callback);
  }

  isConfigured()  {
    return this.getConfig('did') != null  && this.getConfig('did') != ''
  }

  storeToken(token) {
    return realm.write(() => {
      realm.create('Configuration', { key: 'registration_token', value: ""+token}, true);
    });
  }

  clearLocalMessageCache() {
    realm.write(() => {
      realm.delete(realm.objects('Message'));
  });
  }

  getContact(the_number) {
    out = realm.objects('Contact').filtered('number = "'+the_number+'"')[0];
    if (out == null) {
      out = {
        _id: the_number,
        name: Contact.contactToNumber(the_number),
        avatar: null
      }
    }
    return out;
  }

  countContacts() {
    return realm.objects('Contact').length;
  }

  async updateCachedContacts(contacts) {
    return await realm.write( () => {
      var added_contacts = []
      for (contact of contacts) {
        display_name = contact.givenName;
        if (contact.familyName > ""){
          display_name= contact.givenName+ " "+contact.familyName;
        }

        avatar = null
        if (contact.thumbnailPath > "")  {
          avatar = contact.thumbnailPath;
        }
        for (pn of contact.phoneNumbers ) {
          added_contacts.concat(Contact.numberToContact(pn.number));

            realm.create('Contact',
              {
                number: Contact.numberToContact(pn.number),
                name: display_name,
                avatar: avatar
              },
              true )

        }
      }
      realm.objects('Contact').map((r) => {
        if (! r.number in added_contacts) {
          realm.delete(r);
        }
      }
    );
  });
  }

  async sendMessage(contact, text) {
    params = {
      method: 'sendSMS',
      dst: contact,
      did: this.getConfig('did'),
      message: text
    }
    return await this.callVoipMS(params);
  }

  fetchNewMessages() {
    existing_messages_date = realm.objects('Message').sorted('date',true)[0].date;
    query_since = moment(existing_messages_date).subtract(1,'day').format('YYYY-MM-DD');
    return this.fetchMessages(query_since, null, null).then(() => {
      return realm.objects('Message');
    })
  }

  fetchOldMessages(from_date, to_date, contact) {
    return this.fetchMessages(from_date,to_date, contact).then(() => {
      return realm.objects('Message')
    })
  }

  fetchAllMessages() {
    return this.fetchMessages(moment().subtract(2, 'month').format('YYYY-MM-DD'), null, null).then(() => {
      return realm.objects('Message')
    })
  }

  async fetchMessages(from, to, contact) {
    if (from > "") {
    }
    else {
      from = "2016-01-01"
    }

    params = {
      method: 'getSMS',
      from: moment(from).format('YYYY-MM-DD'),
      did: this.getConfig('did'),
      limit: 200
    }
    if (to > "") {
      params.to = moment(to).format('YYYY-MM-DD')
    }
    if (contact > "") {
      params.contact = contact
    }

    return await this.callVoipMS(params).then((messages) => {
      if (messages.status == 'success') {
        for (var m of messages.sms) {
          realm.write(() => {
            var mes = m;
            sp = m.date.split(" ");
            d = sp[0].split("-").concat(sp[1].split(":"));
            date = new Date(d[0],d[1]-1,d[2],d[3],d[4],d[5])
            mes['date'] = date
            let message = realm.create('Message', mes, true);
          });
        }
      }
      else {
          console.log("Error fetching messages from Voip.MS: "+messages.status)
      }
    });
  }

  callVoipMS(params) {
    params.api_username = this.getConfig('username');
    params.api_password = this.getConfig('password');
    params.content_type = 'json';
    let urlParameters = Object.keys(params).map((i) => i+'='+params[i]).join('&')

    if (params.api_password > "")
      return fetch(URL+"?"+urlParameters).then((response) => response.json());
    else
      throw("Please set a password");
  }


  async getSMSDID() {
    params = {
      method: 'getDIDsInfo',
    }

    return await this.callVoipMS(params).then((response) => {
      if (response.status == 'success') {
        return response.dids.filter((did) => {
          return did.sms_enabled == '1';
        });
      }
      else {
          console.log("Error fetching DID from Voip.MS: "+response.status)
          throw(response.status)
      }
    });
  }

  getConfig(key) {
    c = realm.objects('Configuration').filtered('key = "'+key+'"')[0]
    if (c == null)
      return null
    else
      return c.value;
  }

  getAllConfig() {
    conf = {};
    for (k of CONFIGURATION_KEYS) {
      conf[k] = this.getConfig(k)
    }
    return conf;
  }

  setConfig(state) {
    realm.write(() => {
      did_has_changed = false;
      Object.keys(state).filter((k) => {
        return CONFIGURATION_KEYS.includes(k);
      }).map((k) => {
        if (k == 'did' && state[k] != this.getConfig('did')) {
          did_has_changed = true;
          console.log("DID has changed, resetting messages");
        }
        realm.create('Configuration', {key: k, value: state[k]}, true)

      });
      if (did_has_changed) {
        realm.delete(realm.objects('Message'));
        this.fetchAllMessages();
      }
    });
  }

  getMessages(currentContact) {
    mess = realm.objects('Message');
    cc = null;
    if (this.getConfig('did') > "") {
      mess = mess.filtered('did = "'+this.getConfig('did')+'"');
    }
    if (currentContact > "" ) {
      mess = mess.filtered('contact = "'+currentContact+'"');
      cc = this.getContact(currentContact)
    }
    return mess.sorted('date', true).map( (mes) => { return mes.toGiftedMessage(cc, this)});
  }

  getThreads () {
    mess = realm.objects('Message').filtered('did = "'+this.getConfig('did')+'"').sorted('date', true);
    contacts = Array.from(new Set(mess.map( (m) => { return m.contact })));
    return contacts.map( (c) => {
      last_message = mess.filtered('contact = "'+c+'"').sorted('date',true)[0];
      return {
        contact: c,
        date: last_message.date,
        message: last_message.message
      }
    }).filter((c) => {
      return this.ignoredDIDs().indexOf(c.contact) == -1;
    }).sort((c1,c2) => {
      if (c1.date < c2.date)
        return 1
      else if (c1.date > c2.date)
        return -1
      else
        return 0
      });
  }

  ignoreContact(contact) {
    var ignored_did = [contact].concat(this.ignoredDIDs());
    console.log (ignored_did);
    realm.write( () => {
      realm.create('Configuration', {key: 'ignored_did', value: ignored_did.join(",")}, true)
    });
  }

  ignoredDIDs() {
    val = this.getConfig('ignored_did')
    return (val != null && val != "") ? val.split(",") : []
  }

}
