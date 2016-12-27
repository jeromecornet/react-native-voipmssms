import React, { PropTypes, Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button,
  TouchableHighlight,
  Image
} from 'react-native';

import {GiftedChat, Actions, Bubble} from 'react-native-gifted-chat';
import CustomActions from '../components/CustomActions';
import CustomView from '../components/CustomView';
import DB from '../DB'
import TopBar from '../components/TopBar'
import Contact from '../models/Contact';

var moment = require('moment');

export default class ChatScene extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      loadEarlier: true,
      typingText: null,
      isLoadingEarlier: false,
      earliest_date: moment(),
    };

    this.db = new DB();

    this._isMounted = false;
    this.onSend = this.onSend.bind(this);
    this.onReceive = this.onReceive.bind(this);
    this.renderCustomActions = this.renderCustomActions.bind(this);
    this.renderBubble = this.renderBubble.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.onLoadEarlier = this.onLoadEarlier.bind(this);

    this._isAlright = null;

  }

  componentWillMount() {
    this._isMounted = true;
    the_contact=this.db.getContact(this.props.currentContact);
    this.setState({
      messages: this.db.getMessages(this.props.currentContact),
      contact_name: the_contact.name,
      contact_image: (the_contact.avatar != null) ? {uri: the_contact.avatar} : require('../img/ic_account_box_48pt.png')
    });
    this.db.registerCallback(this._refreshMessages.bind(this));
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.db.unregisterCallback(this._refreshMessages.bind(this));
  }

  _refreshMessages(changes) {
    this.setState(() => {
      return {messages: this.db.getMessages(this.props.currentContact)}
    });
  }

  onLoadEarlier() {
    this.setState((previousState) => {
      return {
        isLoadingEarlier: true,
      };
    });

    if (this._isMounted === true) {
      earliest_date = this.state.earliest_date
      if (this.state.messages.length>0) {
        earliest_date = moment(this.state.messages[0].createdAt);
      }

      this.db.fetchOldMessages(earliest_date.subtract(1,'day'),
      earliest_date,
      this.props.currentContact).then( () => {
        this.setState((previousState) => {
          return {
            messages: this.db.getMessages(this.props.currentContact),
            earliest_date: earliest_date,
            isLoadingEarlier: false,
          };
        })
      });
    }
  }

  onSend(messages = []) {
    this.setState((previousState) => {
      return {
        messages: GiftedChat.append(previousState.messages, messages),
      };
    });

    this.sendToVoip(messages);
  }

  sendToVoip(messages) {
    if (messages.length > 0) {
      if ((messages[0].image || messages[0].location) || !this._isAlright) {
        this.setState((previousState) => {
          return {
            typingText: 'Sending'
          };
        });
      }
    }
    m = messages[0]
    this.db.sendMessage(this.props.currentContact, m.text).then( (m) =>{
      if (this._isMounted === true) {
        this._isAlright = true;
        this.setState((previousState) => {
          return {
            typingText: null,
          };
        });
      }
    });
  }

  onReceive(text) {

  }

  renderCustomActions(props) {
    return (
      <CustomActions
      {...props}
      />
    );
  }

  renderBubble(props) {
    return (
      <Bubble
      {...props}
      wrapperStyle={{
        left: {
          backgroundColor: '#f0f0f0',
        }
      }}
      />
    );
  }

  renderCustomView(props) {
    return (
      <CustomView
      {...props}
      />
    );
  }

  renderFooter(props) {
    if (this.state.typingText) {
      return (
        <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
        {this.state.typingText}
        </Text>
        </View>
      );
    }
    return null;
  }

  render() {
    return (
      <View style={styles.container}>
      <TopBar
      onAction={this.props.onBack.bind(this)}
      mainText={this.state.contact_name}
      subText={Contact.contactToNumber(this.props.currentContact)}
      iconPath={() => require('../img/ic_keyboard_arrow_left_48pt.png')}
      //otherIcon={() => this.state.contact_image }
      />
      <GiftedChat
      messages={this.state.messages}
      onSend={this.onSend.bind(this)}
      loadEarlier={this.state.loadEarlier}
      onLoadEarlier={this.onLoadEarlier}
      isLoadingEarlier={this.state.isLoadingEarlier}
      user={{
        _id: 1,
      }}
      renderActions={this.renderCustomActions}
      renderBubble={this.renderBubble}
      renderCustomView={this.renderCustomView}
      renderFooter={this.renderFooter}
      />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  footerContainer: {
    marginTop: 5,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#aaa',
  }
});

ChatScene.propTypes = {
  title: PropTypes.string.isRequired,
  currentContact: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
};
