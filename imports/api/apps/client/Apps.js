/* global localStorage */
import { Apps } from '../Apps'
import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { Tracker } from 'meteor/tracker'
import { DDP } from 'meteor/ddp-client'
import { ReactiveDict } from 'meteor/reactive-dict'

const _apps = new ReactiveDict()
const _connections = {}

Apps.debug = true

function connect (name, url) {
  if (!_connections[name]) {
    _connections[name] = DDP.connect(url)
  }
  return _connections[name]
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
  Tracker.autorun(computation => {
    // skip this computation if there is
    // currently no logged in backend user
    if (Meteor.status().connected && !Meteor.user() && !Meteor.userId()) {
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
      log(name, 'not yet connected -> skip', status.retryCount)
      if (status.retryCount >= 3) {
        log(name, 'cancel connection')
        computation.stop()
      }
      return
    }

    // skip if we have not explcitly enabled the DDP login
    if (!ddpLogin) {
      computation.stop()
      return
    }

    // update userId and skip,
    // if we are already logged-in
    const userId = connection.userId()
    const loggingIn = connection._loggingIn
    updateLogin(name, userId)
    if (userId || loggingIn) return

    log(name, 'get credentials')
    connection._loggingIn = true
    Apps.methods.getServiceCredentials.call((err, credentials) => {
      if (err || !credentials) {
        connection._loggingIn = false
        console.error(err)
        log(name, 'no credentials received, skip login')
        return
      }
      log(name, 'init login')
      const options = { accessToken: credentials.accessToken, debug: Apps.debug }
      DDP.loginWithLea(connection, options, (err, res) => {
        connection._loggingIn = false
        if (err) {
          Meteor.logout()
          // TODO
          //   add error to app, so we can display this issue
          //   in the overview template
          return console.error(err)
        } else {
          log(name, 'logged in with token', !!res)
          updateLogin(name, connection.userId())
          computation.stop()
          configure(name)
        }
      })
    })
  })
}

/**
 *
 * @param callback {function(name:string, done:function):void} callback to call after parsing is done
 */
Apps.loadConfig = function (callback) {
  _loadConfigHandler = callback
}

let _loadConfigHandler = () => {
  throw new Error('No config loader registered! Register via Apps.loadConfig.')
}

function configure (name) {
  _loadConfigHandler(name, function (err, config) {
    if (err) {
      log(name, 'config error')
      log(err)
      return hostLoaded(name, err, null)
    }
    log(name, 'config received successful')
    updateConfig(name, config)
    hostLoaded(name, null, true)
  })
}

const callbacks = new Map()

Apps.onHostLoaded = function (name, cb) {
  const hostCbs = callbacks.get(name) || []
  hostCbs.push(cb)
  callbacks.set(name, hostCbs)
}

function hostLoaded (name, err, res) {
  const loadedCbs = callbacks.get(name)
  if (!loadedCbs || loadedCbs.length === 0) {
    return
  }

  loadedCbs.forEach(cb => {
    setTimeout(() => cb(err, res), 0)
  })

  loadedCbs.length = 0
}

Apps.register = function ({ name, label, url, icon, ddpConnect, ddpLogin }) {
  const app = _apps.set(name, { name, label, url, icon, ddpConnect, ddpLogin })
  if (ddpConnect) {
    const connection = connect(name, url)
    track(name, connection, ddpLogin)
  }
  return app
}

Apps.get = function (name) {
  const app = _apps.get(name)
  const connection = _connections[name]
  return Object.assign({}, app, { connection })
}

Apps.connection = function (name) {
  return _connections[name]
}

Apps.all = function () {
  const all = _apps.all()
  return all && Object.values(all)
}

Apps.subscribe = (appName, contextName) => Meteor.subscribe(Apps.publications.getByNames.name, { appName, contextName })

const templates = new Map()
Apps.registerTemplate = (name, options) => templates.set(name, options)
Apps.getRegisteredTemplates = () => Array.from(templates)
Apps.getUriBase = function (name) {
  check(name, String)
  const connection = _connections[name]
  check(connection, Match.Where(x => typeof x === 'object'))
  return connection._stream.rawUrl
}

export { Apps }
