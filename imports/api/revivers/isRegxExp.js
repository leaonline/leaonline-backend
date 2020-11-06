import { EJSON } from 'meteor/ejson'

export const isRegExp = (key, value) => {
  if (value && value.$regexp) {
    return EJSON.fromJSONValue(value)
  }
}
