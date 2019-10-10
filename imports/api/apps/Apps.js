import { DDP } from 'meteor/ddp-client'
import { Tracker } from 'meteor/tracker'
import { onClient, onServer } from '../../utils/arch'
import { getCollection } from '../../utils/collection'
import { SubsManager } from '../subscriptions/SubsManager'

export const Apps = {
  name: 'apps',
  label: 'apps.title',
  icon: 'cubes'
}

Apps.schema = {
  name: String,
  label: String,
  url: String,
  icon: String,
  status: {
    type: Object,
    optional: true
  },
  'status.connected': {
    type: Boolean,
    optional: true
  },
  'status.status': {
    type: String,
    optional: true
  },
  'status.retryCount': {
    type: Number,
    optional: true
  },
  'status.retryTime': {
    type: Number,
    optional: true
  },
  'status.reason': {
    type: String,
    optional: true
  },
  login: {
    type: Object,
    optional: true
  },
  'login.successful': {
    type: Boolean,
    optional: true
  },
  'login.error': {
    type: String,
    optional: true
  }
}

let _collection

Apps.collection = function () {
  if (!_collection) {
    _collection = getCollection(Apps.name)
  }
  return _collection
}

if (Meteor.isServer) {

  const _trackers = {}
  const _connections = {}

  const connect = function (name, url) {
    if (!_connections[ name ]) {
      _connections[ name ] = DDP.connect(url)
    }
    return _connections[ name ]
  }

  Apps.register = function ({ name, label, url, icon, username, password }) {
    const AppsCollection = Apps.collection()
    let appDoc = AppsCollection.findOne({ name })
    if (!appDoc) {
      AppsCollection.insert({ name, label, url, icon })
    } else {
      AppsCollection.update(appDoc._id, { $set: { name, label, url, icon } })
    }
    appDoc = AppsCollection.findOne({ name })

    const connection = connect(name, url)

    _trackers[ name ] = Tracker.autorun(Meteor.bindEnvironment(computation => {
      // Tracker instance will rerun on every status update
      // so we also update the collection to publish the status
      // to the client application immediately
      const status = connection.status()
      if (typeof status !== 'object') return

      if (status.connected) {
        DDP.loginWithPassword(connection, { username }, password, (err) => {
          if (err) {
            console.error(err)
            AppsCollection.update(appDoc._id, { $set: { login: { successful: false, reason: err.message } } })
          } else {
            AppsCollection.update(appDoc._id, { $set: { login: { successful: true } } })
          }
        })
      }

      Meteor.setTimeout(() => {
        AppsCollection.update(appDoc._id, {$set: { status }})
      }, 50)
    }))

    return appDoc
  }

  Apps.updateStatus = function (name, status) {
    const appDoc = Apps.collection().findOne({ name })
    return A
  }

  Apps.get = function (name) {
    return Apps.collection().findOne({ name })
  }

}

Apps.methods = {}

Apps.methods.proxy = {
  name: 'apps.methods.proxy',
  isPublic: true, // FIXME once Roles are in package
  numRequests: 25,
  timeInterval: 1000,
  schema: {
    name: String,
    label: String,
    args: {
      type: Object,
      optional: true,
      blackbox: true
    }
  },
  run: onServer(function ({ name, label, args }) {
    const app = Apps.get(name)
    if (!app) {
      throw new Meteor.Error(400, `apps.undefinedApp`, name)
    }

    return app.connection.call(name, args)
  }),
  call: onClient(function (name, label, args, cb) {
    Meteor.call(Apps.methods.proxy.name, { name, label, args }, cb)
  })
}

Apps.publications = {}

Apps.publications.all = {
  name: 'apps.publications.all',
  schema: {},
  numRequests: 1,
  timeInterval: 500,
  isPublic: true, // FIXME once Roles are in package
  run: onServer(function () {
    return Apps.collection().find()
  }),
  subscribe: onClient(function () {
    return SubsManager.subscribe(Apps.publications.all.name)
  })
}
