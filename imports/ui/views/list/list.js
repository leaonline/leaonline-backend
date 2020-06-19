import { Template } from 'meteor/templating'
import { EJSON } from 'meteor/ejson'
import { StateVariables } from '../../config/StateVariables'
import { StateActions } from '../../config/StateActions'
import { Router } from '../../../api/routes/Router'
import { wrapEvents, wrapHelpers, wrapOnCreated } from '../../config/backendConfigWrappers'
import { dataTarget } from '../../../utils/event'
import { formIsValid } from '../../../utils/form'
import { getPreviewData } from '../../config/getPreviewData'
import { defaultNotifications } from '../../../utils/defaultNotifications'
import { defineUndefinedFields } from '../../../utils/defineUndefinedFields'
import { by300 } from '../../../utils/dely'
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

    return Object.assign({}, target, { onClosed: onClosed.bind(instance) })
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
  'click .current-document-preview-button' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    const doc = templateInstance.mainCollection.findOne(targetId)
    const unsaved = false // no need to compare list docs
    previewDoc(templateInstance, { doc, unsaved })
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
  'click .preview-formDoc-button' (event, templateInstance) {
    event.preventDefault()
    const doc = getUnsavedFormDoc(templateInstance)
    const compare = getCompare(templateInstance)
    previewDoc(templateInstance, { doc, compare })
  },
  'click .show-source-button' (event, templateInstance) {
    event.preventDefault()
    const doc = getUnsavedFormDoc(templateInstance)
    if (!doc) return
    const compare = getCompare(templateInstance)
    const template = 'stringified'
    previewDoc(templateInstance, { doc, compare, template })
  },
  'submit #updateForm' (event, templateInstance) {
    event.preventDefault()

    const updateDoc = formIsValid('updateForm', templateInstance.actionUpdateSchema, { template: templateInstance })
    if (!updateDoc) return

    const target = templateInstance.state.get('updateDoc')
    updateDoc._id = target._id
    defineUndefinedFields(updateDoc, target)

    templateInstance.state.set(StateVariables.submitting, true)
    const actonUpdate = templateInstance.state.get('actionUpdate')
    const app = templateInstance.data.app()
    const { connection } = app
    connection.call(actonUpdate.name, updateDoc, by300((err, res) => {
      templateInstance.state.set(StateVariables.submitting, false)
      defaultNotifications(err, res)
        .success(function () {
          Router.queryParam({ action: null })
          templateInstance.state.set('updateForm', false)
        })
    }))
  },
  'click .linked-document-preview-button' (event, templateInstance) {
    event.preventDefault()
    const docId = dataTarget(event, templateInstance)
    const contextName = dataTarget(event, templateInstance, 'context')
    const appName = templateInstance.data.app().name
    const previewTarget = getPreviewData({ docId, contextName, appName })
    templateInstance.state.set({ previewTarget })
  }
}))

function onClosed () {
  this.state.set('previewTarget', null)
}

function previewDoc (templateInstance, { doc, unsaved, compare, template, titleField }) {
  if (!doc) return console.warn('Attempt to preview undefined doc')

  const previewTarget = { doc, unsaved, template, titleField }

  if (typeof unsaved === 'undefined') {
    previewTarget.unsaved = EJSON.stringify(doc) !== EJSON.stringify(compare)
  }

  if (typeof template === 'undefined') {
    const renderer = templateInstance.state.get(StateVariables.actionPreview)
    previewTarget.template = renderer?.template
  }

  if (typeof titleField === 'undefined') {
    const config = templateInstance.data.config()
    previewTarget.titleField = config.representative
  }

  templateInstance.state.set({ previewTarget })
}

function getUnsavedFormDoc (templateInstance) {
  const isUpdateForm = !!templateInstance.state.get('updateDoc')
  const targetForm = isUpdateForm
    ? 'updateForm'
    : 'insertForm'
  const schema = isUpdateForm
    ? templateInstance.actionUpdateSchema
    : templateInstance.actionInsertSchema
  return formIsValid(targetForm, schema)
}

function getCompare (templateInstance) {
  const updateDoc = templateInstance.state.get('updateDoc')
  if (updateDoc) delete updateDoc._id
  return updateDoc
}
