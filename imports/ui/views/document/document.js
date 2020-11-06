import { Template } from 'meteor/templating'
import { wrapHelpers, wrapOnCreated } from '../../config/backendConfigWrappers'
import { formIsValid } from '../../../utils/form'
import { StateVariables } from '../../config/StateVariables'
import '../../components/stringified/stringified'
import './document.html'
import { Router } from '../../../api/routes/Router'
import { by300 } from '../../../utils/dely'
import { defineUndefinedFields } from '../../../utils/defineUndefinedFields'
import { defaultNotifications } from '../../../utils/defaultNotifications'

Template.genericDocument.onCreated(function () {
  const instance = this
  const onSubscribed = () => {
    const updateDoc = instance.mainCollection.findOne() || {}
    console.log('update doc', updateDoc)
    delete updateDoc._id
    instance.state.set({ updateDoc })
  }

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
  },
  editMode () {
    return Template.instance().state.get('editMode')
  }
}))

Template.genericDocument.events({
  'click .edit-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('editMode', true)
  },
  'submit #updateForm' (event, templateInstance) {
    event.preventDefault()
debugger
    const updateDoc = formIsValid('updateForm', templateInstance.actionUpdateSchema, {
      template: templateInstance,
      fallback: false
    })

    if (!updateDoc) return

    const target = templateInstance.state.get('updateDoc')

    // we need to clean both documents in case the schema is updated
    // and the target still contains fields that are not part of the schema
    const cleanOptions = {
      mutate: true,
      filter: true,
      autoConvert: true,
      removeEmptyStrings: true
    }

    templateInstance.actionUpdateSchema.clean(updateDoc, cleanOptions)
    templateInstance.actionUpdateSchema.clean(target, cleanOptions)

    updateDoc._id = target._id
    defineUndefinedFields(updateDoc, target)

    templateInstance.state.set(StateVariables.submitting, true)
    templateInstance.state.set('isUpdating', true)
    const actonUpdate = templateInstance.state.get('actionUpdate')
    const app = templateInstance.data.app()
    const { connection } = app

    connection.call(actonUpdate.name, updateDoc, by300((err, res) => {
      if (err) console.error(err)
      templateInstance.state.set(StateVariables.submitting, false)
      defaultNotifications(err, res)
        .success(function () {
          Router.queryParam({ action: null })
          templateInstance.state.set('updateForm', false)
          templateInstance.state.set('isUpdating', false)
          templateInstance.state.set('editMode', false)
        })
    }))
  },
  'click .cancel-edit-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('editMode', false)
  }
})
