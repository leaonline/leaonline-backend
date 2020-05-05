import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { i18n } from '../../api/i18n/I18n'
import { Schema } from '../../api/schema/Schema'
import { createCollection } from '../../factories/createCollection'
import { getCollection } from '../../utils/collection'
import { createFilesCollection } from '../../factories/createFilesCollection'
import { ContextRegistry } from '../../api/ContextRegistry'
import { BackendConfig } from '../../api/config/BackendConfig'
import { LeaCoreLib } from '../../api/core/LeaCoreLib'

// form types
import '../forms/taskContent/taskContent'
import '../forms/imageSelect/imageSelect'
import '../forms/h5p/h5p'

const getDebug = (instance, debug) => debug
  ? (...args) => {
    if (Meteor.isDevelopment) {
      console.info(`[${instance.view.name}]`, ...args)
    }
  }
  : () => {}

export const StateVariables = {
  config: 'config',
  remoteUrl: 'remoteUrl',
  actionRemove: 'actionRemove',
  actionInsert: 'actionInsert',
  actionUpdate: 'actionUpdate',
  actionUpload: 'actionUpload',
  actionPreview: 'actionPreview',
  updateDoc: 'updateDoc',
  documentFields: 'documentFields',
  documentsCount: 'documentsCount',
  allSubsComplete: 'allSubsComplete',
  submitting: 'submitting'
}

export const StateActions = {
  insert: 'insert',
  update: 'update',
  remove: 'remove',
  upload: 'upload'
}

function reviver (key, value) {
  if (key === 'label') {
    return () => i18n.get(value)
  }
  if (key === 'firstOptions') {
    return () => value
  }
  if (key === 'options' && !Array.isArray(value)) {
    const optionsProjection = Object.assign({}, value.projection)
    const optonsMapFct = (el) => {
      return {
        value: el[(value.map && value.map.valueSrc) || '_id'],
        label: el[(value.map && value.map.labelSrc) || 'label']
      }
    }

    return function options () {
      const OptionsCollection = getCollection(value.collectionName)
      if (!OptionsCollection) return []
      const optionsQuery = {}
      if (value.query) {
        Object.keys(value.query).forEach(key => {
          const fieldValue = global.AutoForm.getFieldValue(key)
          if (fieldValue) {
            optionsQuery[key] = fieldValue
          }
        })
      }
      return OptionsCollection.find(optionsQuery, optionsProjection).fetch().map(optonsMapFct)
    }
  }

  switch (value) {
    case 'String':
      return String
    case 'Number':
      return Number
    case 'Array':
      return Array
    case 'Date':
      return Date
    case 'Object':
      return Object
    default:
      return value
  }
}

const fieldsFromCollection = function ({ value, fieldConfig, isArray }) {
  const collection = getCollection(fieldConfig.collection)
  if (!collection) return value

  const toDocumentField = entry => {
    const currentDoc = collection.findOne(entry)
    return currentDoc && currentDoc[fieldConfig.field]
  }

  if (isArray) {
    return value.map(toDocumentField)
  } else {
    return toDocumentField(value)
  }
}

const fieldsFromContext = function ({ fieldConfig, value }) {
  const context = ContextRegistry.get(fieldConfig.context)
  if (!context) return value
  const label = context.helpers.resolveField(value)
  return label && i18n.get(label)
}

const fieldsFromKeyMap = function ({ fieldConfig, value }) {
  const context = ContextRegistry.get(fieldConfig.context)
  const contextValue = context[value]
  if (!contextValue) return value
  const label = contextValue[fieldConfig.srcField]
  return label && i18n.get(label)
}

export const wrapOnCreated = function (instance, { data, debug, onSubscribed } = {}) {
  const logDebug = getDebug(instance, debug)
  const app = data.app()
  const { connection } = app
  console.log(connection, connection.status())
  instance.state.set(StateVariables.remoteUrl, app.url)

  const config = data.config()
  logDebug(config)
  instance.state.set(StateVariables.config, config)

  const actions = config.actions || {}
  instance.state.set(StateVariables.actionRemove, actions.remove)

  // actions - preview
  if (actions.preview) {
    logDebug('load preview', actions.preview.type, actions.preview.name)
    LeaCoreLib[actions.preview.type][actions.preview.name]
      .load()
      .then(() => {
        logDebug('loaded', actions.preview.name)
        instance.state.set(StateVariables.actionPreview, actions.preview)
      })
      .catch(e => console.error(e))
  }

  // actions - insert

  if (actions.insert) {
    instance.state.set(StateVariables.actionInsert, actions.insert)
    const parsedInsertSchema = typeof actions.insert.schema === 'string'
      ? JSON.parse(actions.insert.schema, reviver)
      : actions.insert.schema
    instance.actionInsertSchema = Schema.create(parsedInsertSchema)
  }

  // actions - update

  if (actions.update) {
    instance.state.set(StateVariables.actionUpdate, actions.update)
    const parsedSchema = typeof actions.update.schema === 'string'
      ? JSON.parse(actions.update.schema, reviver)
      : actions.update.schema
    instance.actionUpdateSchema = Schema.create(parsedSchema)
  }

  instance.state.set(StateVariables.actionUpload, actions.upload)

  // fields

  const fieldLabels = {}
  const fieldResolvers = {}
  const fields = config.fields || { _id: 1 }
  Object.keys(fields).forEach(fieldKey => {
    const fieldConfig = fields[fieldKey]
    fieldLabels[fieldKey] = (fieldConfig && fieldConfig.label) || fieldKey
    if (typeof fieldConfig !== 'object') return

    fieldResolvers[fieldKey] = (value) => {
      const isArray = Array.isArray(value)
      switch (fieldConfig.type) {
        case BackendConfig.fieldTypes.collection:
          return fieldsFromCollection({ value, fieldConfig, isArray })
        case BackendConfig.fieldTypes.context:
          return fieldsFromContext({ fieldConfig, value })
        case BackendConfig.fieldTypes.keyMap:
          return fieldsFromKeyMap({ fieldConfig, value })
        default:
          return value
      }
    }
  })
  instance.fieldLabels = Object.values(fieldLabels)
  instance.fieldResolvers = fieldResolvers
  instance.state.set(StateVariables.documentFields, Object.keys(fields))

  if (config.collections) {
    instance.collections = instance.collections || {}

    config.collections.forEach(collectionConfig => {
      const collectionName = typeof collectionConfig === 'string'
        ? collectionConfig
        : collectionConfig.name
      const { isFilesCollection } = collectionConfig
      const collection = getCollection(collectionName)

      if (collection) {
        instance.collections[collectionName] = collection
      } else {
        // create filesCollection if flag is truthy
        instance.collections[collectionName] = createCollection({
          name: collectionName,
          schema: {},
          connection: connection
        })

        // additionally create files collection
        if (isFilesCollection) {
          createFilesCollection({
            collectionName: collectionName,
            collection: instance.collections[collectionName],
            ddp: connection
          })
        }
      }

      // sanity check
      if (!getCollection(collectionName)) {
        throw new Error(`Expected collection to be created by name <${collectionName}>`)
      }
    })
    instance.mainCollection = instance.collections[config.mainCollection]
    logDebug('collections created', instance.collections)
  }

  if (config.publications) {
    const allSubs = {}
    config.publications.forEach(publication => {
      const { name } = publication
      allSubs[name] = false
      const onStop = function (err) {
        if (err) {
          console.error(name, err)
          if (err.message) {
            alert(err.message)
          }
        }
      }
      const onReady = function () {
        logDebug(name, `complete`)
        allSubs[name] = true
        if (Object.values(allSubs).every(entry => entry === true)) {
          logDebug('all subs complete')
          if (onSubscribed) {
            onSubscribed()
          }
          const count = instance.mainCollection.find().count()
          logDebug(instance.mainCollection, instance.mainCollection.find().fetch())
          instance.state.set(StateVariables.documentsCount, count)
          instance.state.set(StateVariables.allSubsComplete, true)
        }
      }
      connection.subscribe(name, {}, { onStop, onReady })
    })
  }
}

export const wrapHelpers = function (obj) {
  return Object.assign({}, {
    config () {
      return Template.instance().state.get(StateVariables.config) || {}
    },
    count () {
      return Template.instance().state.get(StateVariables.documentsCount) || 0
    },
    documents () {
      const instance = Template.instance()
      return instance.mainCollection.find()
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
    submitting () {
      return Template.instance().state.get(StateVariables.submitting)
    },
    // /////////////////////////////////////////////////
    //  FIELDS
    // /////////////////////////////////////////////////

    fields (document) {
      const instance = Template.instance()
      const fields = instance.state.get(StateVariables.documentFields)
      return fields && fields.map(name => {
        const value = document[name]
        const resolver = instance.fieldResolvers[name]

        if (!resolver) {
          return value
        } else {
          return resolver(value)
        }
      })
    },
    fieldLabels () {
      return Template.instance().fieldLabels
    },
    // /////////////////////////////////////////////////
    //  Preview
    // /////////////////////////////////////////////////
    actionPreview () {
      return Template.instance().state.get(StateVariables.actionPreview)
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
    //  insert
    // /////////////////////////////////////////////////
    actionInsert () {
      return Template.instance().state.get(StateVariables.actionInsert)
    },
    insertSchema () {
      const instance = Template.instance()
      return instance.actionInsertSchema
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
    updateDoc () {
      return Template.instance().state.get('updateDoc')
    },
    // /////////////////////////////////////////////////
    //  Remove
    // /////////////////////////////////////////////////
    actionRemove () {
      return Template.instance().state.get(StateVariables.actionRemove)
    }
  }, obj)
}
