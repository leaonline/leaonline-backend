import { Template } from 'meteor/templating'
import { Components } from '../../../api/core/Components'
import { Notifications } from './Notifications'
import './notify.scss'
import './notify.html'
import { dataTarget } from '../../../utils/event'

const componentsLoaded = Components.load([Components.template.icon])

Template.notify.helpers({
  loadComplete() {
    return componentsLoaded.get()
  },
  notifications() {
    return Notifications.entries()
  },
})

Template.notify.onRendered(function () {
  const instance = this
  instance.autorun(() => {
    Notifications.entries().forEach((entry) => {
      if (!entry.visible) {
        instance.$(`[data-id='${entry._id}']`).alert('close')
      }
    })
  })
})

Template.notify.events({
  'close.bs.alert'(event, templateInstance) {
    setTimeout(() => {
      const id = dataTarget(event, templateInstance, 'id')
      Notifications.remove(id)
    }, 50)
  },
})
