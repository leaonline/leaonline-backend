/**
 * Determines, whether a field should be excluded from the current view.
 * We exclude arrays and objects as they require a very detailed and
 * complex resolve strategy, especially for custom field content.
 * @param key {String} the field name
 * @param type {constructor} the potential type constructor
 * @return {boolean} true/false
 */
export const fieldShouldBeExcluded = ({ key, type }) =>
  type === Array || type === Object || key.includes('$')
