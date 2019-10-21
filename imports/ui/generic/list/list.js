import { Template } from 'meteor/templating'
import { StateVariables, StateActions, wrapHelpers, wrapOnCreated } from '../backendConfigWrappers'
import { getCollection } from '../../../utils/collection'
import { createFilesCollection } from '../../../factories/createFilesCollection'
import '../../components/upload/upload'
import './list.html'
import { dataTarget } from '../../../utils/event'
import { Router } from '../../../api/routes/Router'

Template.genericList.onCreated(function () {
  const instance = this
  wrapOnCreated(instance)
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
  }
}))

Template.genericList.events({
  'click .remove-button' (event, templateInstance) {
    event.preventDefault()
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
  'click .cancel-insert-button' (evenr, templateInstance) {
    event.preventDefault()
    Router.queryParam({ action: null })
    templateInstance.state.set('insertForm', false)
  }
})