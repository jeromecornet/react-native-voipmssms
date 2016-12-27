import Contact from '../models/Contact';

var contactDb = new Contact();

export default class Message {

  toGiftedMessage(user, db) {
    if (user == null) {
      user = db.getContact(this.contact);
    };
    you = { _id: 1, name: "You"};
     return {
       _id: this.id,
       text: this.message,
       user: (this.type == '0' ? you : user),
       createdAt: this.date
     }
  }

}

Message.schema = {
    name: 'Message',
    primaryKey: 'id',
    properties: {
        id: 'string',
        date: 'date',
        type: 'string',
        did: { type: 'string' , indexed: true} ,
        contact: {type: 'string', indexed: true},
        message: 'string',
    }
};
