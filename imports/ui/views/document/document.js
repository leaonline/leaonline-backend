import { Template } from 'meteor/templating'
import { StateVariables, wrapHelpers, wrapOnCreated } from '../../config/backendConfigWrappers'
import { formIsValid } from '../../../utils/form'
import './document.html'

Template.genericDocument.onCreated(function () {
  const instance = this
  const onSubscribed = () => instance.state.set('updateDoc', instance.mainCollection.findOne() || {})

  instance.autorun(() => {
    const data = Template.currentData()
    const { pathname } = window.location
    const lastPath = instance.state.get('lastPath')
    if (lastPath !== pathname) {
      instance.state.clear()
      instance.state.set('lastPath', pathname)
    }
    wrapOnCreated(instance, { data, onSubscribed, debug: true })
  })
})

Template.genericDocument.helpers(wrapHelpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get(StateVariables.allSubsComplete) && instance.state.get('updateDoc')
  },
  updateDoc () {
    return Template.instance().state.get('updateDoc')
  },
  isUpdating () {
    return Template.instance().state.get('isUpdating')
  }
}))

Template.genericDocument.events({
  'submit #updateForm' (event, templateInstance) {
    event.preventDefault()

    const app = templateInstance.data.app()
    const { connection } = app
    const actionUpdate = templateInstance.state.get(StateVariables.actionUpdate)
    const updateDoc = templateInstance.state.get('updateDoc')
    const insertDoc = formIsValid('updateForm', templateInstance.actionUpdateSchema)
    if (!insertDoc) {
      return
    }

    templateInstance.state.set('isUpdating', true)
    const finalDoc = Object.assign({}, insertDoc, { _id: updateDoc._id })
    connection.call(actionUpdate.method, finalDoc, (err, res) => {
      setTimeout(() => {
        templateInstance.state.set('isUpdating', false)
      }, 500)
      console.log(err, res)
    })
  }
})
