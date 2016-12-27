var PushNotification = require('react-native-push-notification');

import DB from '../DB'

PUSH_NOTIFICATION_URL = 'https://voipmssmspush.herokuapp.com/notification/'
PUSH_NOTIFICATION_GCM_ID = 922958678259

export default class Notification {

  configure(callback) {
    PushNotification.configure({
      onRegister: this._registerPushNotification.bind(this),

      onNotification: function(notification) {
        return callback(notification);
      },

      // ANDROID ONLY: GCM Sender ID
      senderID: PUSH_NOTIFICATION_GCM_ID,
    });
    PushNotification.cancelAllLocalNotifications();
  }

  sendMessage(message) {
    var db = new DB();

    PushNotification.localNotification({
      /* Android Only Properties */
      id: message.id,
      ticker: "Incoming Message", // (optional)
      autoCancel: true, // (optional) default: true
      largeIcon: "ic_launcher", // (optional) default: "ic_launcher"
      smallIcon: "ic_notification", // (optional) default: "ic_notification" with fallback for "ic_launcher"
      //subText: "New SMS", // (optional) default: none
      color: "#36C3FF", // (optional) default: system default
      ongoing: false, // (optional) set whether this is an "ongoing" notification
      group: "new_sms", // (optional) add group to message

      /* iOS only properties */
      alertAction: 'view',// (optional) default: view
      category: null,// (optional) default: null
      userInfo: null,// (optional) default: null (object containing additional notification data)

      /* iOS and Android properties */
      title: db.getContact(message.contact).name, // (optional, for iOS this is only used in apple watch, the title will be the app name on other iOS devices)
      message: message.message, // (required)
      actions: '["Open"]',  // (Android only) See the doc for notification actions to know more
    });
  }

  _registerPushNotification(token) {
    var db = new DB();

    db.storeToken(token.token);
    this.token = token.token;
    body = JSON.stringify({
      did: db.getConfig('did'),
      token: token.token,
      platform: token.os
    });
    fetch(PUSH_NOTIFICATION_URL,
      { method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body
    }).then(() => {
      console.log("Successfully registered for push notifications")
    }).catch((error) => {
      console.log("Error while registering for push notifications")
    });
  }
}
