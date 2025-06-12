import { Template } from 'meteor/templating'
import { i18n } from '../../api/i18n/i18n'
import { MutationChecker } from './MutationChecker'
import { parseActions } from './parseActions'
import { StateVariables } from './StateVariables'
import { parseCollections } from './collection/parseCollections'
import { parseFields } from './fields/parseFields'
import { loadDocumentsWithDependencies } from './loadDocumentsWithDependencies'
import { defaultNotifications } from '../../utils/defaultNotifications'
import { getDebug } from '../../utils/getDebug'
import { dataTarget } from '../../utils/event'
import { by300 } from '../../utils/dely'

export const wrapOnCreated = (instance, { data, debug, onSubscribed } = {}) => {
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
  parseActions({ instance, config, logDebug, settingsDoc, app })
  loadDocumentsWithDependencies({
    instance,
    config,
    logDebug,
    onSubscribed,
    settingsDoc,
    connection,
  })
  mutationChecker.compare(config)
}

export const wrapHelpers = (obj) =>
  Object.assign(
    {},
    {
      fields(document) {
        const instance = Template.instance()
        const { fieldConfig } = instance
        const fields = instance.state.get(StateVariables.documentFields)

        return fields?.map((key) => {
          const value = document[key]
          const config = fieldConfig[key]
          const resolver = config?.resolver

          return resolver ? resolver(value) : value
        })
      },
      fieldLabels() {
        return Template.instance().fieldLabels
      },
      app() {
        return Template.instance().state.get(StateVariables.app) || {}
      },
      config() {
        return Template.instance().state.get(StateVariables.config) || {}
      },
      count() {
        return Template.instance().state.get(StateVariables.documentsCount) || 0
      },
      documents() {
        const instance = Template.instance()
        const query = instance.state.get('query') || {}
        const transform = instance.state.get('transform') || {}

        console.warn('documents called', query)
        const cursor = instance.mainCollection?.find(query, transform)

        if (!cursor || cursor.count() === 0) return null

        return cursor
      },
      files() {
        const instance = Template.instance()
        return instance.mainCollection?.find()
      },
      link(file) {
        const instance = Template.instance()
        const remoteUrl = instance.state.get(StateVariables.remoteUrl)
        return instance.mainCollection?.filesCollection.link(
          file,
          'original',
          remoteUrl,
        )
      },
      submitting() {
        return Template.instance().state.get(StateVariables.submitting)
      },

      // /////////////////////////////////////////////////
      //  Preview
      // /////////////////////////////////////////////////
      actionPreview() {
        return Template.instance().state.get(StateVariables.actionPreview)
      },
      // /////////////////////////////////////////////////
      //  Upload
      // /////////////////////////////////////////////////
      actionUpload() {
        return Template.instance().state.get(StateVariables.actionUpload)
      },
      actionExport() {
        return Template.instance().state.get(StateVariables.actionExport)
      },
      uploadFilesCollection() {
        const instance = Template.instance()
        return instance.mainCollection?.filesCollection
      },
      // /////////////////////////////////////////////////
      //  insert
      // /////////////////////////////////////////////////
      actionInsert() {
        return Template.instance().state.get(StateVariables.actionInsert)
      },
      insertSchema() {
        const instance = Template.instance()
        return instance.actionInsertSchema
      },
      // /////////////////////////////////////////////////
      //  update
      // /////////////////////////////////////////////////
      actionUpdate() {
        return Template.instance().state.get(StateVariables.actionUpdate)
      },
      updateSchema() {
        const instance = Template.instance()
        return instance.actionUpdateSchema
      },
      updateDoc() {
        return Template.instance().state.get('updateDoc')
      },
      // /////////////////////////////////////////////////
      //  Remove
      // /////////////////////////////////////////////////
      actionRemove() {
        return Template.instance().state.get(StateVariables.actionRemove)
      },
      removing(id) {
        return Template.instance().state.get(StateVariables.removing) === id
      },
      // /////////////////////////////////////////////////
      //  CUSTOM ACTIONS
      // /////////////////////////////////////////////////
      customActions() {
        console.debug(
          'get custom actions',
          Template.instance().state.get(StateVariables.customActions),
        )
        return Template.instance().state.get(StateVariables.customActions)
      },
    },
    obj,
  )

export const wrapEvents = (obj) => {
  const confirmRemove = (title) => i18n.get('actions.confirmRemove', { title })
  return Object.assign(
    {},
    {
      'click .remove-button'(event, templateInstance) {
        event.preventDefault()
        const _id = dataTarget(event, templateInstance)
        const context = templateInstance.data.config()
        const target = templateInstance.mainCollection.findOne(_id)
        const title = context.isFilesCollection
          ? target.name
          : target[context.representative]
        if (!target || !global.confirm(confirmRemove(title))) {
          return
        }

        templateInstance.state.set(StateVariables.removing, _id)
        const removeMethodDef = templateInstance.state.get(
          StateVariables.actionRemove,
        )
        const method = removeMethodDef.name
        const app = templateInstance.data.app()
        const { connection } = app

        connection.call(
          method,
          { _id },
          by300((err, res) => {
            templateInstance.state.set(StateVariables.removing, null)
            defaultNotifications(err, res).success(() => {
              templateInstance.state.set(StateVariables.removed, _id)
            })
          }),
        )
      },
    },
    obj,
  )
}
