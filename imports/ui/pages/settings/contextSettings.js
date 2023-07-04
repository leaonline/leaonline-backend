import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Apps } from '../../../api/apps/client/Apps'
import { ContextRegistry } from '../../../api/config/ContextRegistry'
import { Schema } from '../../../api/schema/Schema'
import { by300 } from '../../../utils/dely'
import { formIsValid } from '../../../utils/form'
import { parseSettings } from '../../config/parseSettings'
import { defaultNotifications } from '../../../utils/defaultNotifications'
import './contextSettings.html'

Template.contextSettings.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()
    const { appName, contextName } = data.params
    const app = Apps.get(appName)
    const config = ContextRegistry.get(contextName)
    if (!app || !config) return

    parseSettings({ instance, config, appName })

    const schema = Apps.getSchemaForContext(config)

    instance.schema = Schema.create(schema)

    instance.state.set({
      loadComplete: true,
      contextName
    })
  })
})

Template.contextSettings.helpers({
  context () {
    const contextName = Template.getState('contextName')
    return contextName && ContextRegistry.get(contextName)
  },
  loadComplete () {
    return Template.getState('loadComplete')
  },
  settingsSchema () {
    return Template.instance().schema
  },
  settingsDoc () {
    return Template.instance().state.get('settingsDoc')
  },
  submitting () {
    return Template.instance().state.get('submitting')
  }
})

Template.contextSettings.events({
  'submit #settingsForm' (event, templateInstance) {
    event.preventDefault()
    const settingsDoc = formIsValid('settingsForm', templateInstance.schema)
    if (!settingsDoc) return

    templateInstance.state.set('submitting', true)
    Meteor.call(Apps.methods.updateSettings.name, settingsDoc, by300((err, res) => {
      templateInstance.state.set('submitting', false)
      defaultNotifications(err, res).success(function () {
        closeSettings(templateInstance)
      })
    }))
  },
  'click .cancel-form-button' (event, templateInstance) {
    event.preventDefault()
    closeSettings(templateInstance)
  }
})

function closeSettings (templateInstance) {
  if (templateInstance.data.onComplete) {
    const { appName, contextName } = templateInstance.data.params
    templateInstance.data.onComplete({ appName, contextName })
  }
}
