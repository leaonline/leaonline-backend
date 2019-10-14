import { DDP } from 'meteor/ddp-client'
import { ReactiveDict } from 'meteor/reactive-dict'
import { getCollection } from '../../utils/collection'
import { onClient, onServer } from '../../utils/arch'

export const Apps = {
  name: 'apps',
  label: 'apps.title',
  icon: 'cubes'
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
  app.status = status
  _apps.set(name, app)
}

function updateLogin (name, userId) {
  const app = _apps.get(name)
  app.login = { successful: !!userId }
  _apps.set(name, app)
}

function track (name, connection) {
  _trackers[ name ] = Tracker.autorun(() => {
    // skip this computation if there is
    // currently no logged in backend user
    if (!Meteor.user() || !Meteor.userId()) {
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
    if (!status.connected) return

    // update userId and skip,
    // if we are already logged-in
    const userId = connection.userId()
    updateLogin(name, userId)
    if (userId) return

    Apps.methods.getServiceCredentials.call((err, credentials) => {
      if (err || !credentials) {
        // TODO update app login status
        return
      }

      const options = { accessToken: credentials.accessToken }
      DDP.loginWithLea(connection, options, (err, result) => {
        console.log('login with lea', err, result)
      })
    })
  })
}

Apps.register = function ({ name, label, url, icon }) {
  const connection = connect(name, url)
  track(name, connection)
  return _apps.set(name, { name, label, url, icon })
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
  numRequests: 1,
  timeInterval: 500,
  run: onServer(function () {
    const user = Meteor.users.findOne(this.userId)
    return user.services.lea
  }),
  call: function (cb) {
    Meteor.call(Apps.methods.getServiceCredentials.name, cb)
  }
}