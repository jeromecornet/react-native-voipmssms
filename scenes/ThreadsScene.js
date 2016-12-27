'use strict';

import React, { PropTypes, Component } from 'react';

import {
  Text,
  ScrollView,
  ListView,
  View,
  Button,
  TouchableHighlight,
  TouchableNativeFeedback,
  RefreshControl,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator
} from 'react-native';

import TimeAgo from 'react-native-timeago';
import TopBar from '../components/TopBar'

import DB from '../DB'
const db = new DB();

import Notification from '../models/Notification'
var notification = new Notification();

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

import Contact from '../models/Contact';
var contact = new Contact();

var ContactPicker = require('NativeModules').ContactPicker;

export default class ThreadsScene extends Component {

  constructor(props) {
    super(props);

    this.state = {
      refreshing: false,
      datasource: ds.cloneWithRows(db.getThreads()),
      contact: "",
      statusText: "" + db.countContacts() + " contacts loaded"
    };
  }

  componentWillMount() {
    db.registerCallback(this._refreshThreads.bind(this));

    if (db.getThreads().length == 0) {
      this.setState({ refreshing: true });
      return db.fetchAllMessages().then(() => {
        this.setState({ refreshing: false, datasource: ds.cloneWithRows(db.getThreads())});
      })
    }
  }

  componentWillUnmount() {
    db.unregisterCallback(this._refreshThreads.bind(this));

    if (db.getThreads().length == 0) {
      this.setState({ refreshing: true });
      return db.fetchAllMessages().then(() => {
        this.setState({ refreshing: false, datasource: ds.cloneWithRows(db.getThreads())});
      })
    }
  }

  _refreshThreads() {
    this.setState(() => { return {datasource: ds.cloneWithRows(db.getThreads())}});
  }

  _onIgnoreContact(contact) {
    db.ignoreContact(contact);
    this.setState({
      datasource: ds.cloneWithRows(db.getThreads())
    });
  }

  _renderRow(rowData, onGotoChat) {
    var the_contact = db.getContact(rowData.contact);
    var image = null;
    if (the_contact.avatar != null) {
      image = {uri: the_contact.avatar};
    }
    else {
      image = require('../img/ic_account_box_48pt.png')
    }
    return (
      <TouchableNativeFeedback
      style={styles.threadRow}
      onLongPress={() => { this._onIgnoreContact(rowData.contact) }}
      onPress={() => { this.props.onGotoChat(rowData.contact) } }>
      <View style={{flex: 1, flexDirection: 'row'}}>
        <Image style={styles.avatar}
          source={image} />

        <View style={{flex: 1, flexDirection: 'column', paddingLeft: 5 }}>
          <View style={styles.threadText}>
            <Text style={styles.threadName}>{the_contact.name}</Text>
            <Text style={styles.threadDate}> /&nbsp;
              <TimeAgo time={rowData.date} />
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.threadMessage}>{rowData.message}</Text>
        </View>
      </View>
      </TouchableNativeFeedback>
    );
  }

  _onRefresh() {
    console.log('fetching messages ');

    this.setState({
        refreshing: true
    });

    contact.loadContacts((isConfigured) => {});

    return db.fetchNewMessages().then(() => {
      console.log('messages fetched');
      this.setState({
          refreshing: false,
          datasource: ds.cloneWithRows(db.getThreads())
      });
    }).catch( (error) => {
      console.log(error);
      this.state.refreshing = false;
    });
  }

  _setNewContactNumber(number) {
    this.setState({contact: number});
  }

  _newConversation() {
    contact = this.state.contact;
    this.setState({contact: ''});
    this.props.onGotoChat(Contact.numberToContact(contact));
  }

  render() {
    if (this.state.datasource.getRowCount() >= 1) {
    return (
      <View style={{flex: 1}}>
        <TopBar
        onAction={this.props.onSetup.bind(this)}
        mainText="Conversations"
        subText={Contact.contactToNumber(db.getConfig('did'))}
        iconPath={() => require('../img/ic_settings_48pt.png')}
        />
        <ListView style={{flex: 1}}
        dataSource={this.state.datasource}
        renderRow={(rowData) => { return this._renderRow(rowData, this.props.onGotoChat)}}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this._onRefresh.bind(this)}
          />}
      />
      <TextInput placeholder="Enter a new phone number"
        onChangeText={(text) => this._setNewContactNumber(text)}
        onSubmitEditing={this._newConversation.bind(this)}
        value={this.state.contact}
        autoFocus={false}
        keyboardType="phone-pad"
        returnKeyType="go"
        clearButtonMode="always"
        selectTextOnFocus={true}
      />
      <Button  style={styles.actionButton}
      onPress={ () => {
        if (this.state.contact) {
          this._newConversation();
        }
        else {
          ContactPicker.pickContact().then((number) => {
            if (number != "") {
              var n = Contact.numberToContact(number);
              this.props.onGotoChat(n);
            }
          });
        }
      }}
      title={ (this.state.contact > "") ? "New conversation" : "New conversation from Contacts" }/>
      </View>
    )
    }
    else {
      return <View style={{flex: 1}}>
      <TopBar
      onAction={this.props.onSetup.bind(this)}
      mainText="Conversations"
      subText='Loading...'
      iconPath={() => require('../img/ic_settings_48pt.png')}
      />
      <ActivityIndicator
          style={styles.centering}
          size={48}
        />
      </View>
    }
  }
}

const styles = StyleSheet.create({
  centering: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  threadRow: {
    height: 68,
    padding: 4,
  },
  threadText: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 4,
  },
  threadName: {
    fontSize: 18,
    textAlignVertical: 'bottom',
    color: '#0d3140',
  },
  threadDate: {
    fontSize: 13,
    marginBottom: 2,
    textAlignVertical: 'bottom',
    textAlign: 'left',
  },
  threadMessage: {
    fontSize: 13,
    marginBottom: 8,
  },
  avatar: {
    margin: 7,
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  actionButton: {
    height: 64,
  }
});


ThreadsScene.propTypes = {
  title: PropTypes.string.isRequired,
  onGotoChat: PropTypes.func.isRequired,
  onSetup: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};
