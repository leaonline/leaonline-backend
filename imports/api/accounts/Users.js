export const Users = {
  name: 'users',
  label: 'contexts.users.title',
  icon: 'users'
}

Users.inject = {}

let _i18nGet = x => x
const _i18nReactive = (...args) => () => _i18nGet(...args)

Users.inject.i18n = function (getFct) {
  _i18nGet = getFct
}

Users.schema = {}

/**
 * The login procedure is not a Meteor method and is there configured as an own top-level obejct.
 */

Users.login = {}
Users.login.schema = {
  username: {
    type: String,
    label: _i18nReactive('contexts.users.username'),
    autoform: {
      autocomplete: 'username'
    }
  },
  password: {
    type: String,
    label: _i18nReactive('contexts.users.password'),
    autoform: {
      type: 'password',
      autocomplete: 'current-password'
    }
  }
}
