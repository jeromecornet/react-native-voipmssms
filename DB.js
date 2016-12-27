const Realm = require('realm');

import Message from './models/Message';
import Configuration from './models/Configuration';
const PATH = 'voipms.realm';
const URL = "https://voip.ms/api/v1/rest.php"

export default class DB {

  constructor() {
    realm = new Realm({path: PATH, schema: [Message, Configuration]});
    realm.write(() => {
      
    });
    this.clearLocalMessageCache();
    //this.seedDB()
  }

  clearLocalMessageCache() {
    realm.write(() => {
      realm.delete(realm.objects('Message'));
    });
  }

  fetchAllMessages() {
    params = {
      method: 'getSMS',
      from: this.getConfig('ORIGINAL_DATE'),
      did: this.getConfig('DID')
    }

    return this.callVoipMS(params, (messages) => {
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
    });
  }

  callVoipMS(params, callback) {
    params.api_username = this.getConfig('USERNAME');
    params.api_password = this.getConfig('PASSWORD');
    params.content_type = 'json';
    let urlParameters = Object.keys(params).map((i) => i+'='+params[i]).join('&')
    return fetch(URL+"?"+urlParameters).then((response) => response.json()).then(callback);
  }

  getConfig(key) {
    return realm.objects('Configuration').filtered('key = "'+key+'"')[0].value;
  }

  getMessages () {
    return realm.objects('Message').filtered('did = "'+this.getConfig('DID')+'" AND contact != "'+this.getConfig('FORWARD_DID')+'"').map( (mes) => { return mes.toGiftedMessage(); });
  }

}
