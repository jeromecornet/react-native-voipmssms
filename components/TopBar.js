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
} from 'react-native';

export default class TopBar extends Component {
  render() {
    return <View style={styles.topBar}>
      <TouchableNativeFeedback
      onPress={() => {this.props.onAction()}}>
        <Image style={styles.actionImage}
        source={this.props.iconPath()}/>
      </TouchableNativeFeedback>
      { (this.props.otherIcon != undefined) ?
           <Image style={styles.otherIcon}
            source={this.props.otherIcon()} />
          : <Text/>
      }
      <Text style={styles.headText}>{this.props.mainText}</Text>
      { (styles.subText !== undefined) ?
          <Text style={styles.subText}>{this.props.subText}</Text> :
          <Text />
      }
    </View>
  }

}
const styles = StyleSheet.create({
  headText: {
    flex: 1,
    fontSize: 18,
    color: '#0d3140',
    textAlign: 'left',
    textAlignVertical: 'center',
    marginLeft: 4,
  },
  subText: {
    flex: 1,
    fontSize: 12,
    color: '#0d3140',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  topBar: {
    flex: 0,
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#36C3FF',
  },
  otherIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    margin: 2
  },
  actionImage: {
    width: 48,
    height: 48,
    margin: 8,
  }
});

TopBar.propTypes = {
  mainText: PropTypes.string.isRequired,
  subText: PropTypes.string,
  iconPath: PropTypes.func.isRequired,
  otherIcon: PropTypes.func,
  onAction: PropTypes.func.isRequired,
};
