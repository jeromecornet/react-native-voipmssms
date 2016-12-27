import Contacts from 'react-native-contacts';

import DB from '../DB'

export default class Contact {

  loadContacts(callback) {
     return  Contacts.checkPermission( (err, permission) => {
       const db = new DB();

      if(permission === 'undefined') {
         Contacts.requestPermission( (err, permission) => {
          Contacts.getAll((err, contacts) => {
            db.updateCachedContacts(contacts).then(() => {callback(db.isConfigured)});
          });
        })
      }
      if(permission === 'authorized'){
         return Contacts.getAll((err, contacts) => {
          db.updateCachedContacts(contacts).then(() => {callback(db.isConfigured)});
        });
      }
      if(permission === 'denied'){
        all_contacts = [];
        callback(db.isConfigured);
      }
    })
  }

  static numberToContact(number) {
    full_number = number.replace(/[^0-9]/g,'')
    return full_number.substr(full_number.length - 10)
  }

  static contactToNumber(contact) {
    if (contact.length == 10)
      return "("+contact.slice(0,3)+") "+contact.slice(3,6)+"-"+contact.slice(6);
    else
      return contact;
  }

}

Contact.schema = {
  name: 'Contact',
  primaryKey: 'number',
  properties: {
    number: 'string',
    name: {type: 'string', optional: true, default: ''},
    avatar: {type: 'string', optional: true, default: ''}
  }
}
