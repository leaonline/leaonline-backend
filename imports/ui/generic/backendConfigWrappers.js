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
//import '../forms/taskContent/taskContent'
//import '../forms/imageSelect/imageSelect'
//import '../forms/h5p/h5p'

const dependencyCache = new Set()

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

const fieldsFromCollection = function ({ value, fieldConfig, isArray }) {
  const collection = getCollection(fieldConfig.dependency.collection)
  if (!collection) return value

  const toDocumentField = entry => {
    const currentDoc = collection.findOne(entry)
    return currentDoc && currentDoc[fieldConfig.dependency.field]
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

function toFormSchema (srcSchema) {
  const schema = Object.assign({}, srcSchema)
  Object.entries(schema).forEach(([key, value]) => {
    const autoform = {}

    if (value.dependency) {
      const { dependency } = value
      const transform = { sort: { [dependency.field]: 1 } }
      const query = dependency.query || {}
      const toOptions = doc => ({ value: doc._id, label: doc[dependency.field] })
      autoform.firstOption = () => i18n.get('form.selectOne')
      autoform.options = () => {
        const collection = getCollection(dependency.collection)
        return collection
          ? collection.find(query, transform).fetch().map(toOptions)
          : []
      }
      dependencyCache.add(dependency.collection)
    }

    value.autoform = autoform
  })
  return schema
}

function parseActions ({ instance, config, logDebug }) {
  const actions = config.methods || {}
  const schema = config.schema || {}

  if (actions.remove) {
    instance.state.set(StateVariables.actionRemove, actions.remove)
  }

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

  if (actions.insert) {
    const insertFormSchema = toFormSchema(actions.insert.schema || schema)
    console.log(insertFormSchema)
    instance.actionInsertSchema = Schema.create(insertFormSchema)
    instance.state.set(StateVariables.actionInsert, actions.insert)
  }

  if (actions.update) {
    const updateFormSchema = toFormSchema(actions.update.schema || schema)
    instance.actionUpdateSchema = Schema.create(updateFormSchema)
    instance.state.set(StateVariables.actionUpdate, actions.update)
  }

  if (actions.upload) {
    instance.state.set(StateVariables.actionUpload, actions.upload)
  }
}

function getFieldConfig (config, key, field) {
  const fieldConfig = Object.assign({
    label: `${config.name}.${key}`
  }, field)

  if (field.dependency) {
    fieldConfig.type = BackendConfig.fieldTypes.collection
  }
  if (field.context) {
    fieldConfig.type = BackendConfig.fieldTypes.context
  }

  return fieldConfig
}

function parseFields ({ instance, config, logDebug }) {
  const fieldLabels = {}
  const fieldResolvers = {}
  const fields = {}

  // create fields from schema
  Object.entries(config.schema).forEach(([key, value]) => {
    // skip all non-public fields
    if (value.list === false) return

    const fieldConfig = getFieldConfig(config, key, value)

    fields[key] = 1
    fieldLabels[key] = fieldConfig.label

    fieldResolvers[key] = (value) => {
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
}

function parseCollections ({ instance, config, connection, logDebug }) {
  instance.collections = instance.collections || new Map()

  // merge all contexts into a single list
  // so we can easily create everything in a row
  const allCollections = config.dependencies && config.dependencies.length > 0
    ? [config].concat(config.dependencies)
    : [config]

  allCollections.forEach(collectionConfig => {
    const collectionName = typeof collectionConfig === 'string'
      ? collectionConfig
      : collectionConfig.name
    const { isFilesCollection } = collectionConfig
    const collection = getCollection(collectionName)

    if (collection) {
      instance.collections.set(collectionName, collection)
    } else {
      // create filesCollection if flag is truthy
      const filesCollectionSource = createCollection({
        name: collectionName,
        schema: {},
        connection: connection
      })

      instance.collections.set(collectionName, filesCollectionSource)

      // additionally create files collection
      if (isFilesCollection) {
        createFilesCollection({
          collectionName: collectionName,
          collection: filesCollectionSource,
          ddp: connection
        })
      }
    }

    // sanity check
    if (!getCollection(collectionName)) {
      throw new Error(`Expected collection to be created by name <${collectionName}>`)
    }
  })
  const mainCollectionName = config.mainCollection || config.name
  instance.mainCollection = instance.collections.get(mainCollectionName)
  logDebug('collections created')
}

function parsePublications ({ instance, config, logDebug, onSubscribed, connection }) {
  const allSubs = {}
  const allPublications = Object.values(config.publications)
  if (config.dependencies) {
    config.dependencies.forEach(dep => {
      Object.values(dep.publications).forEach(depPub => allPublications.push(depPub))
    })
  }

  allPublications.forEach(publication => {
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

const toName = context => context.name

export const wrapOnCreated = function (instance, { data, debug, onSubscribed } = {}) {
  const logDebug = getDebug(instance, debug)
  const app = data.app()
  const { connection } = app
  instance.state.set(StateVariables.remoteUrl, app.url)

  const config = data.config()
  logDebug(config)

  instance.state.set(StateVariables.config, config)

  parseCollections({ instance, config, connection, logDebug })
  parseActions({ instance, config, logDebug })
  parsePublications({ instance, config, logDebug, onSubscribed, connection })
  parseFields({ instance, config, logDebug })
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
      return instance.mainCollection && instance.mainCollection.find()
    },
    files () {
      const instance = Template.instance()
      return instance.mainCollection && instance.mainCollection.find()
    },
    link (file) {
      const instance = Template.instance()
      const remoteUrl = instance.state.get(StateVariables.remoteUrl)
      return instance.mainCollection && instance.mainCollection.filesCollection.link(file, 'original', remoteUrl)
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
      const instance = Template.instance()
      return instance.mainCollection && instance.mainCollection.filesCollection
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
