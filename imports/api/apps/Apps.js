import { DDP } from 'meteor/ddp-client'
import { ReactiveDict } from 'meteor/reactive-dict'
import { i18n } from '../i18n/I18n'
import { BackendConfig } from '../config/BackendConfig'
import { getCollection } from '../../utils/collection'
import { onClient, onServer } from '../../utils/arch'

export const Apps = {
  name: 'apps',
  label: 'apps.title',
  icon: 'cubes',
  debug: false
}

const _apps = new ReactiveDict()
const _connections = {}
const _trackers = {}

function connect (name, url) {
  if (!_connections[ name ]) {
    _connections[ name ] = DDP.connect(url)
  }
  return _connections[ name ]
}

function updateStatus (name, status) {
  const app = _apps.get(name)
  if (!app) {
    throw new Error(`[Apps] expected app by name ${name}`)
  }
  app.status = status
  _apps.set(name, app)
}

function updateLogin (name, userId) {
  const app = _apps.get(name)
  app.login = { successful: !!userId }
  _apps.set(name, app)
}

function updateConfig (name, config) {
  const app = _apps.get(name)
  app.config = config
  _apps.set(name, app)
}

function log (...args) {
  if (Apps.debug && Meteor.isDevelopment) {
    console.info('[Apps]', ...args)
  }
}

function track (name, connection, ddpLogin) {
  const url = connection._stream.rawUrl
  _trackers[ name ] = Tracker.autorun(() => {
    // skip this computation if there is
    // currently no logged in backend user
    if (!Meteor.user() || !Meteor.userId()) {
      // clear localStorage entries from previous
      // login results to avoid follow-up 403 errors
      localStorage.removeItem(`${url}/lea/userId`)
      localStorage.removeItem(`${url}/lea/loginToken`)
      localStorage.removeItem(`${url}/lea/loginTokenExpires`)
      // logout connection if still connected
      if (connection.userId()) {
        connection.call('logout')
      }
      return
    }

    // always update status to
    // trigger reactive Template updates
    const status = connection.status()
    updateStatus(name, status)

    // also skip if we are not yet connected
    if (!status.connected) {
      log(url, 'not yet connected -> skip')
      return
    }

    // skip if we have not explcitly enabled the DDP login
    if (!ddpLogin) {
      return
    }

    // update userId and skip,
    // if we are already logged-in
    const userId = connection.userId()
    const loggingIn = connection._loggingIn
    updateLogin(name, userId)
    if (userId || loggingIn) return

    log(url, 'get credentials')
    connection._loggingIn = true
    Apps.methods.getServiceCredentials.call((err, credentials) => {
      if (err || !credentials) {
        connection._loggingIn = false
        console.error(err)
        log(url, 'no credentials received, skip login')
        return
      }
      log(url, 'init login')
      const options = { accessToken: credentials.accessToken, debug: Apps.debug }
      DDP.loginWithLea(connection, options, (err, res) => {
        connection._loggingIn = false
        if (err) {
          return console.error(err)
        } else {
          log(url, 'logged in with token', !!res)
          configure(name)
        }
      })
    })
  })
}

const configure = function (name) {
  const app = Apps.get(name)
  const { url } = app
  const { connection } = app
  const lang = i18n.getLocale()

  connection.call(BackendConfig.methods.get.name, { lang }, (err, config) => {
    log(url, 'backend config received', config)
    if (err) return console.error(err)
    if (config) {
      BackendConfig.parent(name, config)
      i18n.add(lang, config.lang)
      updateConfig(name, config)
      BackendConfig.children(name, config)
    }
  })
}

Apps.register = function ({ name, label, url, icon, ddpConnect, ddpLogin }) {
  if (ddpConnect) {
    const connection = connect(name, url)
    track(name, connection, ddpLogin)
  }
  return _apps.set(name, { name, label, url, icon, ddpConnect, ddpLogin })
}

Apps.get = function (name) {
  const app = _apps.get(name)
  const connection = _connections[ name ]
  return Object.assign({}, app, { connection })
}

Apps.connection = function (name) {
  return _connections[ name ]
}

Apps.all = function () {
  const all = _apps.all()
  return all && Object.values(all)
}

Apps.methods = {}

Apps.methods.getServiceCredentials = {
  name: 'apps.methods.getServiceCredentials',
  schema: {},
  isPublic: true, // fixme,
  numRequests: 5,
  timeInterval: 500,
  run: onServer(function () {
    const user = Meteor.users.findOne(this.userId)
    return user.services.lea
  }),
  call: function (cb) {
    Meteor.call(Apps.methods.getServiceCredentials.name, cb)
  }
}