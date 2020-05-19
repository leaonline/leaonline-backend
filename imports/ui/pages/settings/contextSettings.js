import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Apps } from '../../../api/apps/client/Apps'
import { ContextRegistry } from '../../../api/config/ContextRegistry'
import { Schema } from '../../../api/schema/Schema'
import { formIsValid } from '../../../utils/form'
import { parseSettings } from '../../config/parseSettings'
import './contextSettings.html'

Template.contextSettings.onCreated(function () {
  const instance = this
  instance.autorun(() => {
    if (!Apps.subscriptions().ready()) return
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
      contextName: contextName
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
  }
})

Template.contextSettings.events({
  'submit #settingsForm' (event, templateInstance) {
    event.preventDefault()
    const settingsDoc = formIsValid('settingsForm', templateInstance.schema)
    if (!settingsDoc) return

    templateInstance.state.set('updating', true)
    Meteor.call(Apps.methods.updateSettings.name, settingsDoc, (err, res) => {
      templateInstance.state.set('updating', false)
      console.log(err, res)
    })
  }
})