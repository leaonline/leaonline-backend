import { Template } from 'meteor/templating'
import { wrapEvents, wrapHelpers, wrapOnCreated } from '../../config/backendConfigWrappers'
import { StateVariables } from '../../config/StateVariables'
import { StateActions } from '../../config/StateActions'
import { dataTarget } from '../../../utils/event'
import { Router } from '../../../api/routes/Router'
import { formIsValid } from '../../../utils/form'
import { getPreviewData } from '../../config/getPreviewData'
import { by300 } from '../../../utils/dely'
import '../../components/upload/upload'
import '../../components/preview/preview'
import '../../components/summary/summary'
import './list.html'
import { defaultNotifications } from '../../../utils/defaultNotifications'

Template.genericList.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()
    const { pathname } = window.location
    const lastPath = instance.state.get('lastPath')
    if (lastPath !== pathname) {
      instance.state.clear()
    }
    wrapOnCreated(instance, { data, debug: false })
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
    const target = instance.state.get('previewTarget')
    if (!target) return

    return Object.assign({}, target, { onClosed: onClosed.bind(instance)})
  }
}))

Template.genericList.events(wrapEvents({
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
    const schema = templateInstance.actionInsertSchema
    const insertDoc = formIsValid('insertForm', schema)
    if (!insertDoc) return

    templateInstance.state.set(StateVariables.submitting, true)
    const actionInsert = templateInstance.state.get('actionInsert')
    const app = templateInstance.data.app()
    const { connection } = app

    connection.call(actionInsert.name, insertDoc, by300((err, res) => {
      templateInstance.state.set(StateVariables.submitting, false)
      defaultNotifications(err, res)
        .success(function () {
          Router.queryParam({ action: null })
          templateInstance.state.set('insertForm', false)
        })
    }))
  },
  'click .show-source-button' (event, templateInstance) {
    event.preventDefault()
    const doc = templateInstance.state.get('updateDoc')
    const template = 'fallBack'
    templateInstance.state.set('previewTarget', { doc, template })
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
    connection.call(actonUpdate.name, updateDoc, by300((err, res) => {
      templateInstance.state.set(StateVariables.submitting, false)
      defaultNotifications(err, res)
    }))
  },
  'click .document-preview-button' (event, templateInstance) {
    event.preventDefault()
    const docId = dataTarget(event, templateInstance)
    const contextName = dataTarget(event, templateInstance, 'context')
    const previewTarget = getPreviewData({ docId, contextName })
    templateInstance.state.set({ previewTarget })
  }
}))

function onClosed () {
  this.state.set('previewTarget', null)
}