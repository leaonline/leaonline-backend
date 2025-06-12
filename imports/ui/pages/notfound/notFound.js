import { Template } from 'meteor/templating'
import { Router } from '../../../api/routes/Router'
import './notFound.html'

Template.notFound.events({
  'click .lea-pagenotfound-button'(event, templateInstance) {
    event.preventDefault()
    const route = templateInstance.data.next()
    Router.go(route)
  },
})
