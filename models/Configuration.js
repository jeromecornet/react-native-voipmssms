export default class Configuration {

}

Configuration.schema = {
  name: 'Configuration',
  primaryKey: 'key',
  properties: {
    key: 'string',
    value: {type: 'string', optional: true, default: ''}
  }
}
