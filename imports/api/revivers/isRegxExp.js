import { EJSON } from 'meteor/ejson'

export const isRegExp = (_key, value) => {
  if (value?.$regexp) {
    return EJSON.fromJSONValue(value)
  }
}
