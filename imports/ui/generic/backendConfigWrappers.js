import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { getCollection } from '../../utils/collection'
import { LeaCoreLib } from '../../api/core/LeaCoreLib'
import { parseActions } from './config/parseActions'
import { StateVariables } from './config/StateVariables'
import { parseCollections } from './config/parseCollections'
import { parseFields } from './config/parseFields'
import { parsePublications } from './config/parsePublications'
import { MutationChecker } from './config/MutationChecker'

const getDebug = (instance, debug) => debug
  ? (...args) => {
    if (Meteor.isDevelopment) {
      console.info(`[${instance.view.name}]`, ...args)
    }
  }
  : () => {}

export const wrapOnCreated = function (instance, { data, debug, onSubscribed } = {}) {
  const logDebug = getDebug(instance, debug)
  const app = data.app()
  const { connection } = app
  instance.state.set(StateVariables.remoteUrl, app.url)

  const config = data.config()
  const mutationChecker = new MutationChecker(config, config.name)

  instance.state.set(StateVariables.config, config)
  parseCollections({ instance, config, connection, logDebug })
  mutationChecker.compare(config)
  parseFields({ instance, config, logDebug })
  mutationChecker.compare(config)
  parseActions({ instance, config, logDebug })
  mutationChecker.compare(config)
  parsePublications({ instance, config, logDebug, onSubscribed, connection })
  mutationChecker.compare(config)
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
