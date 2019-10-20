import { getCollection } from '../../utils/collection'
import { createCollection } from '../../factories/createCollection'
import { createFilesCollection } from '../../factories/createFilesCollection'
import { Template } from 'meteor/templating'
import { Schema } from '../../api/schema/Schema'

const getDebug = (instance, debug) => debug
  ? (...args) => {
    if (Meteor.isDevelopment) {
      console.info(`[${instance.view.name}]`, ...args)
    }
  }
  : () => {}

export const StateVariables = {
  remoteUrl: 'remoteUrl',
  actionRemove: 'actionRemove',
  actionInsert: 'actionInsert',
  actionUpdate: 'actionUpdate',
  actionUpload: 'actionUpload',
  documentFields: 'documentFields',
  documentsCount: 'documentsCount',
  allSubsComplete: 'allSubsComplete'
}

export const wrapOnCreated = function (instance, { debug, onSubscribed }) {
  const logDebug = getDebug(instance, debug)
  const app = instance.data.app()
  const { connection } = app
  instance.state.set(StateVariables.remoteUrl, app.url)

  const config = instance.data.config()
  logDebug(config)

  const actions = config.actions || {}
  instance.state.set(StateVariables.actionRemove, actions.remove)

  if (actions.update) {
    instance.state.set(StateVariables.actionUpdate, actions.update)
    const parsedSchema = typeof actions.update.schema === 'string'
      ? JSON.parse(actions.update.schema)
      : actions.update.schema
    instance.actionUpdateSchema = Schema.create(parsedSchema)
  }

  instance.state.set(StateVariables.actionUpload, actions.upload)
  instance.state.set(StateVariables.documentFields, Object.keys(config.fields || {}))

  if (config.collections) {
    instance.collections = instance.collections || {}
    config.collections.forEach(collectionName => {
      const collection = getCollection(collectionName)
      if (collection) {
        instance.collections[ collectionName ] = collection
      } else {
        // create filesCollection if flag is truthy
        instance.collections[ collectionName ] = createCollection({
          name: collectionName,
          schema: {}
        }, { connection })
        if (config.isFilesCollection) {
          createFilesCollection({
            collectionName: collectionName,
            collection: instance.collections[ collectionName ],
            ddp: connection
          })
        }
      }
    })
    instance.mainCollection = instance.collections[ config.mainCollection ]
    logDebug('collections created', instance.collections)
  }

  if (config.publications) {
    const allSubs = {}
    config.publications.forEach(publication => {
      const { name } = publication
      allSubs[ name ] = false
      Tracker.autorun(() => {
        logDebug('subscribe to', name)
        const sub = connection.subscribe(name, {})
        if (sub.ready()) {
          allSubs[ name ] = true
          logDebug(name, 'complete')
        }
        if (Object.values(allSubs).every(entry => entry === true)) {
          logDebug('all subs complete')
          if (onSubscribed) {
            onSubscribed()
          }
          const count = instance.mainCollection.find().count()
          instance.state.set(StateVariables.documentsCount, count)
          instance.state.set(StateVariables.allSubsComplete, true)
        }
      })
    })
  }
}

export const wrapHelpers = function (obj) {
  return Object.assign({}, {
    fields (document) {
      const fields = Template.instance().state.get(StateVariables.documentFields)
      return fields.map(name => document[ name ])
    },
    count () {
      return Template.instance().state.get(StateVariables.documentsCount) || 0
    },
    files () {
      const instance = Template.instance()
      return instance.mainCollection.find()
    },
    link (file) {
      const instance = Template.instance()
      const remoteUrl = instance.state.get(StateVariables.remoteUrl)
      return instance.mainCollection.filesCollection.link(file, 'original', remoteUrl)
    },
    // /////////////////////////////////////////////////
    //  Upload
    // /////////////////////////////////////////////////
    actionUpload () {
      return Template.instance().state.get(StateVariables.actionUpload)
    },
    uploadFilesCollection () {
      return Template.instance().mainCollection.filesCollection
    },
    // /////////////////////////////////////////////////
    //  update
    // /////////////////////////////////////////////////
    actionUpdate () {
      return Template.instance().state.get(StateVariables.actionUpdate)
    },
    updateSchema () {
      const instance = Template.instance()
      return instance.actionUpdateSchema
    },
    // /////////////////////////////////////////////////
    //  Remove
    // /////////////////////////////////////////////////
    actionRemove () {
      return Template.instance().state.get(StateVariables.actionRemove)
    }
  }, obj)
}