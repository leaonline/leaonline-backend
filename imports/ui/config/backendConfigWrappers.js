import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { getCollection } from '../../utils/collection'
import { LeaCoreLib } from '../../api/core/LeaCoreLib'
import { parseActions } from './parseActions'
import { StateVariables } from './StateVariables'
import { parseCollections } from './parseCollections'
import { fieldHelpers, parseFields } from './parseFields'
import { parsePublications } from './parsePublications'
import { MutationChecker } from './MutationChecker'
import { getDebug } from '../../utils/getDebug'
import { Apps } from '../../api/apps/client/Apps'
import { Schema } from '../../api/schema/Schema'
import { formIsValid } from '../../utils/form'


export const wrapOnCreated = function (instance, { data, debug, onSubscribed } = {}) {
  const logDebug = getDebug(instance, debug)
  const app = data.app()
  const { connection } = app
  instance.state.set(StateVariables.remoteUrl, app.url)

  const appName = app.name
  const config = data.config()
  const mutationChecker = new MutationChecker(config, config.name)
  const settingsDoc = data.settings() || {}

  instance.state.set(StateVariables.app, appName)
  instance.state.set(StateVariables.config, config)
  parseCollections({ instance, config, connection, logDebug })
  parseFields({ instance, config, logDebug, appName, settingsDoc })
  parseActions({ instance, config, logDebug })
  parsePublications({ instance, config, logDebug, onSubscribed, connection })
  mutationChecker.compare(config)
}

export const wrapHelpers = function (obj) {
  return Object.assign({}, {
    ...fieldHelpers(),
    app () {
      return Template.instance().state.get(StateVariables.app) || {}
    },
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
    }
  }, obj)
}

export const wrapEvents = (obj) => Object.assign({}, {}, obj)
