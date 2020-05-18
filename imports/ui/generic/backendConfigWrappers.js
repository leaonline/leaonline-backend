import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { getCollection } from '../../utils/collection'
import { LeaCoreLib } from '../../api/core/LeaCoreLib'
import { parseActions } from './config/parseActions'
import { StateVariables } from './config/StateVariables'
import { parseCollections } from './config/parseCollections'
import { fieldHelpers, parseFields } from './config/parseFields'
import { parsePublications } from './config/parsePublications'
import { MutationChecker } from './config/MutationChecker'
import { getDebug } from '../../utils/getDebug'
import { Apps } from '../../api/apps/client/Apps'
import { Schema } from '../../api/schema/Schema'
import { formIsValid } from '../../utils/form'

const settingsSchema = Schema.create(Apps.schema)

export const wrapOnCreated = function (instance, { data, debug, onSubscribed } = {}) {
  const logDebug = getDebug(instance, debug)
  const app = data.app()
  const { connection } = app
  instance.state.set(StateVariables.remoteUrl, app.url)

  const appName = app.name
  const config = data.config()
  const mutationChecker = new MutationChecker(config, config.name)

  instance.state.set(StateVariables.config, config)
  parseCollections({ instance, config, connection, logDebug })
  mutationChecker.compare(config)
  parseFields({ instance, config, logDebug, appName })
  mutationChecker.compare(config)
  parseActions({ instance, config, logDebug })
  mutationChecker.compare(config)
  parsePublications({ instance, config, logDebug, onSubscribed, connection })
  mutationChecker.compare(config)
}

export const wrapHelpers = function (obj) {
  return Object.assign({}, {
    ...fieldHelpers(),
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
    },
    // /////////////////////////////////////////////////
    //  Settings
    // /////////////////////////////////////////////////
    settingsSchema () {
      return settingsSchema
    }
  }, obj)
}

export const wrapEvents = (obj) => Object.assign({}, {
  'submit #settingsForm' (event, templateInstance) {
    event.preventDefault()
    const settingsDoc = formIsValid('settingsForm', settingsSchema)
    if (!settingsDoc) return
  }
}, obj)
