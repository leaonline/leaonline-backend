import { Template } from 'meteor/templating'
import { StateVariables, StateActions, wrapHelpers, wrapOnCreated } from '../backendConfigWrappers'
import { dataTarget } from '../../../utils/event'
import { Router } from '../../../api/routes/Router'
import { formIsValid } from '../../../utils/form'
import { by300 } from '../../../utils/dely'
import { i18n } from '../../../api/i18n/I18n'
import '../../components/upload/upload'
import '../../components/preview/preview'
import './list.html'

Template.genericList.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()
    const { pathname } = window.location
    const lastPath = instance.state.get('lastPath')
    if (lastPath !== pathname) {
      instance.state.clear()
    }
    wrapOnCreated(instance, { data, debug: true })
    instance.state.set('lastPath', pathname)
  })
})

Template.genericList.helpers(wrapHelpers({
  loadComplete () {
    return Template.instance().state.get(StateVariables.allSubsComplete)
  },
  insertForm () {
    return Template.getState('insertForm')
  },
  updateForm () {
    return Template.getState('updateForm')
  },
  previewTarget () {
    const instance = Template.instance()
    return instance.state.get('previewTarget')
  },
  onClosed () {
    const instance = Template.instance()
    return onClosed.bind(instance)
  }
}))

Template.genericList.events({
  'click .remove-button' (event, templateInstance) {
    event.preventDefault()

    if (!global.confirm(i18n.get('actions.confirmRemove'))) return

    const removeContext = templateInstance.state.get('actionRemove')
    const { method } = removeContext
    const _id = dataTarget(event, templateInstance)
    const app = templateInstance.data.app()
    const { connection } = app

    connection.call(method, { _id }, (err, res) => {
      console.log(err, res)
    })
  },
  'click .insert-button' (event, templateInstance) {
    event.preventDefault()
    Router.queryParam({ action: StateActions.insert })
    templateInstance.state.set('insertForm', true)
  },
  'click .edit-button' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    Router.queryParam({ action: StateActions.update, doc: target })
    const updateDoc = templateInstance.mainCollection.findOne(target)
    if (!updateDoc) {
      // notify err
      console.info(target, templateInstance.mainCollection.find().fetch())
      return console.error('no doc found')
    } else {
      console.log('update doc', updateDoc)
    }
    templateInstance.state.set('updateDoc', updateDoc)
    templateInstance.state.set('updateForm', true)
  },
  'click .cancel-form-button' (event, templateInstance) {
    event.preventDefault()
    Router.queryParam({ action: null })
    templateInstance.state.set('insertForm', false)
    templateInstance.state.set('updateForm', false)
  },
  'click .preview-button' (event, templateInstance) {
    event.preventDefault()
    const { template, titleField } = templateInstance.state.get(StateVariables.actionPreview)
    if (!template) return
    const targetId = dataTarget(event, templateInstance)
    const doc = templateInstance.mainCollection.findOne(targetId)
    if (!doc) return
    templateInstance.state.set('previewTarget', { doc, template, titleField })
  },
  // //////////////////////////////////////////////////////
  // FORM EVENTS
  // //////////////////////////////////////////////////////
  'submit #insertForm' (event, templateInstance) {
    event.preventDefault()

    const insertDoc = formIsValid('insertForm', templateInstance.actionInsertSchema)
    if (!insertDoc) return

    templateInstance.state.set(StateVariables.submitting, true)
    const actionInsert = templateInstance.state.get('actionInsert')
    const app = templateInstance.data.app()
    const { connection } = app
    connection.call(actionInsert.method, insertDoc, by300((err, res) => {
      templateInstance.state.set(StateVariables.submitting, false)
      if (err) {
        // TODO handle form error
        return console.error(err)
      }
      Router.queryParam({ action: null })
      templateInstance.state.set('insertForm', false)
    }))
  },
  'submit #updateForm' (event, templateInstance) {
    event.preventDefault()

    const updateDoc = formIsValid('updateForm', templateInstance.actionUpdateSchema)
    if (!updateDoc) return

    const target = templateInstance.state.get('updateDoc')
    updateDoc._id = target._id

    templateInstance.state.set(StateVariables.submitting, true)
    const actonUpdate = templateInstance.state.get('actionUpdate')
    const app = templateInstance.data.app()
    const { connection } = app
    connection.call(actonUpdate.method, updateDoc, by300((err, res) => {
      templateInstance.state.set(StateVariables.submitting, false)
      if (err) {
        // TODO handle form error
        return console.error(err)
      } else {
        console.log(res)
      }

      // TODO notify success
    }))
  }
})

function onClosed () {
  this.state.set('previewTarget', null)
}