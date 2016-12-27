import React, { PropTypes, Component } from 'react';

import {
  Text,
  ScrollView,
  TextInput,
  Button,
  Picker,
  StyleSheet,
  View,
  TouchableNativeFeedback,
  Image
} from 'react-native';
import TopBar from '../components/TopBar'
import Contact from '../models/Contact';

import DB from '../DB'
const db = new DB();

export default class SetupScene extends Component {

  constructor(props) {
    super(props);
    this.state = db.getAllConfig();
    if (this.state.did > "") {
      this.state.available_did = [{did: this.state.did, note: ''}];
    }
    else {
      this.state.last_error = 'Please login'
      this.state.available_did = [  ];
    }
    this.state.password_editable = this._isPasswordBlank();
    this._isMounted = false;
    this._isAlright = null;
  }

  componentWillMount() {
    this._fetchDID();
    this._isMounted = true;
    this.setState({password_editable: this._isPasswordBlank()})
  }

  _isPasswordBlank() {
    return !( this.state.password > "")
  }
  _fetchDID() {
    db.setConfig(this.state);
    this.setState({available_did: []});
    db.getSMSDID().then((dids) => {
      this.setState({available_did: dids, last_error: ''})
    }).catch((error) => {
      if (error == 'invalid_credentials') {
        this.setState({last_error: 'Invalid login', available_did: [], did: ''})
      }
      else {
        this.setState({last_error: error, available_did: [], did: ''})
      }
    });
  }
  componentWillUnmount() {
    this._isMounted = false;
    this.setState({password_editable: this._isPasswordBlank()});
  }

  onSaveConfiguration() {
    this.setState({password_editable: this._isPasswordBlank()});
    db.setConfig(this.state);
    this.props.onSave();
  }

  onBack() {
    this.setState({password_editable: this._isPasswordBlank()});
    this.props.onBack();
  }
  _renderLogin(){
    return (
      <View>
      <Text style={styles.property}>Username:</Text>
      <TextInput
      ref="1"
      style={styles.valueInput}
      placeholder="Enter the API username"
      keyboardType='email-address'
      returnKeyType='next'
      onChangeText={(text) => this.state.username = text }
      >{this.state.username}</TextInput>
      <TouchableNativeFeedback
        onLongPress={() => this.setState({password_editable: true})}>
      <Text style={styles.property}>Password: (long press here to edit)</Text>
      </TouchableNativeFeedback>
      <TextInput
      ref="2"
      style={styles.valueInput}
      placeholder="Enter the API password"
      editable={this.state.password_editable}
      secureTextEntry={true}
      selectTextOnFocus={true}
      onChangeText={(text) => this.state.password = text  }
      onSubmitEditing={this._fetchDID.bind(this)}
      >{this.state.password}</TextInput>
      </View>
    )
  }

  _renderDIDPicker() {
    if (this.state.available_did.length > 0 ) {
      return (
        <View>
        <Text style={styles.property}>DID with SMS capability:</Text>
        <Picker
          autoFocus={true}
          style={styles.valueInput}
          selectedValue={ (this.state.did > "") ? this.state.did : "" }
          onValueChange={(itemValue, itemPos) => this.setState({ did: itemValue})}
          mode="dropdown">
          {this.state.available_did.map((did) => (
            <Picker.Item
              key={did.did}
              label={Contact.contactToNumber(did.did ) +" / "+did.note}
              value={did.did}
            />)
          )}
        </Picker>
        <Text style={styles.property}>Blacklisted contacts</Text>
        <TextInput
        ref="4"
        style={styles.valueInput}
        placeholder="Comma separated list of ignored contacts"
        onChangeText={(text) => this.state.ignored_did = text  }
        >{this.state.ignored_did}</TextInput>
        </View>
      )
      }
      else {
        return <Text style={styles.property}>{this.state.last_error}</Text>
      }
  }

  render() {
    return (
      <View style={{flex: 1}}>
      <TopBar
      onAction={this.onBack.bind(this)}
      mainText="Configuration"
      iconPath={() => require('../img/ic_keyboard_arrow_left_48pt.png')}
      />
      <ScrollView style={{flex: 1, marginTop: 8}}>
      {this._renderLogin()}
      {this._renderDIDPicker()}
      <Button
        style={styles.actionButton}
        onPress={() => {
          if (this.state.did > "") {
            this.onSaveConfiguration();
          }
          else {
            this._fetchDID();
          }
        }}
        title={(this.state.did > "") ? "Save" : "Login"}
      />
      </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  property: {
    marginLeft: 8,
    marginRight: 8,
    fontSize: 16,
    color: '#0d3140',
  },
  valueInput: {
    marginLeft: 16,
    marginRight: 8,
    marginBottom: 10,
  },
  actionButton: {
    height: 64,
  }
});

SetupScene.propTypes = {
  title: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};
