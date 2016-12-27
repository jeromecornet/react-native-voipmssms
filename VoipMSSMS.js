import React, { Component  } from 'react';
import { AppRegistry, Navigator, BackAndroid, Text } from 'react-native';

import ChatScene from './scenes/ChatScene';
import SetupScene from './scenes/SetupScene';
import ThreadsScene from './scenes/ThreadsScene';

import Notification from './models/Notification'
import Contact from './models/Contact';
import DB from './DB'

var navigator;
var currentContact = '';

export default class VoipMSSMS extends Component {

  constructor(props) {
    super(props);
    db = new DB();
    contact = new Contact();
    notification = new Notification();

    this.state = {
      loading: false,
      isConfigured: db.isConfigured()
    };

    contact.loadContacts(()=> {});
    notification.configure(this._handleNotification.bind(this));
  }

  componentWillMount(){
    BackAndroid.addEventListener('hardwareBackPress', () => { return this.handleBackPress(); } );
  }

  componentWillUnmount(){
    BackAndroid.removeEventListener('hardwareBackPress', () => { return this.handleBackPress();} );
  }

  handleBackPress() {
    if (navigator && navigator.getCurrentRoutes().length > 1) {
        navigator.pop();
        return true;
    }
    return false;
  }

  backHandler (route, navigator) {
    if (route.index > 0) {
      navigator.pop();
    }
  }

  _handleNotification(notification) {
    db = new DB();

    if (notification.foreground) {
      db.fetchNewMessages();
    }
    else if (notification.userInteraction) {
      navigator.push({
        title: 'Contacts',
        index: 0,
      });
    }
    else {
      var notification = new Notification();
      var db = new DB();
      db.fetchNewMessages().then((messages) => {
        notification.sendMessage(messages.slice(-1)[0])
      });
    }
  }

  _configureScene(route, routeStack) {
    return Navigator.SceneConfigs.HorizontalSwipeJump
  }

  _renderScene (route, navigator) {
    switch(route.index) {
      case 0:
      return <ThreadsScene
      title={route.title}
      onSetup={() => {
        navigator.push({
          title: 'Setup',
          index: 1,
        });
      }}
      onGotoChat={(contact) => {
        currentContact = contact;
        navigator.push({
          title: 'Chat',
          index: 2
        });
      }}

      onBack={() => { this.backHandler (route, navigator)}}/>

      case 1:
      return <SetupScene
      title={route.title}

      // Function to call when a new scene should be displayed
      onSave={() => {
        navigator.push({
          title: 'Contacts',
          index: 0,
        });
      }}

      onBack={() => { this.backHandler (route, navigator)}}/>
      case 2:
      return <ChatScene
      title={route.title}

      currentContact={currentContact}
      onBack={() => { this.backHandler (route, navigator)}}/>
    }
  }

  render() {
    if (this.state.loading == true)
      return <Text>Loading contacts...</Text>
    else
    return (
      <Navigator
      ref={(nav) => { navigator = nav; }}
      initialRoute={this.state.isConfigured ? { title: 'Contacts', index: 0 } : { title: 'Setup', index: 1 }}
      renderScene={this._renderScene.bind(this)}
      configureScene={this._configureScene.bind(this)}
      />
    )}
}
