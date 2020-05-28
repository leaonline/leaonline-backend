import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { ContextRegistry } from '../../../api/config/ContextRegistry'
import { Apps } from '../../../api/apps/Apps'
import { parseActions } from '../../config/parseActions'
import { formIsValid } from '../../../utils/form'
import './autoform'
import './itemForm.html'

Template.afLeaItemForm.onCreated(function () {
  const instance = this
  instance.state = new ReactiveDict()

  const { atts } = instance.data
  instance.state.set('invalid', atts.class && atts.class.indexOf('invalid') > -1)
  instance.state.set('disabled', Object.prototype.hasOwnProperty.call(atts, 'disabled'))
  instance.state.set('dataSchemaKey', atts['data-schema-key'])
  instance.state.set({ loadComplete: true })
})

Template.afLeaItemForm.helpers({
  loadComplete () {
    return Template.getState('loadComplete')
  },
  errors () {
    return Template.getState('errors')
  },
  schema () {
    return Template.instance().schema
  },
  atts () {
    const instance = Template.instance()

    return {
      id: getFormId(instance),
      schema: instance.actionInsertSchema,
      type: 'normal',
      class: 'item-form',
      validate: 'submit'
    }
  },
  dataSchemaKey () {
    const instance = Template.instance()
    return instance.state.get('dataSchemaKey')
  },
  formId () {
    return getFormId(Template.instance())
  },
  itemDoc () {
    return Template.getState('itemDoc')
  },
  itemPreview () {
    const instance = Template.instance()
    const itemDoc = instance.state.get('itemDoc')
    if (!itemDoc) return

    return {
      type: 'item',
      subtype: instance.data.atts.contextName,
      value: itemDoc,
      width: 'col-12'
    }
  }
})

Template.afLeaItemForm.events({
  'submit .item-form' (event, templateInstance) {
    event.preventDefault()
    const formId = templateInstance.$(event.currentTarget).prop('id')
    const itemDoc = formIsValid(formId, templateInstance.actionInsertSchema)
    const contextName = templateInstance.data.atts.context
    const config = ContextRegistry.get(contextName)
    const appName = templateInstance.data.atts.app
    const app = Apps.get(appName)
    app.connection.call(config.methods.insert.name, itemDoc, (err, res) => {
      console.log(err, res)
      itemDoc._id = res
      updateValue(res, templateInstance)
      templateInstance.state.set({ itemDoc })
    })
  }
})

function updateValue (_id, templateInstance) {
  templateInstance.$('.afLeaItemFormHiddenInput').val(_id)
}

function getFormId (templateInstance) {
  return templateInstance.data && `afLeaItemForm_${templateInstance.data.atts['data-schema-key']}`
}