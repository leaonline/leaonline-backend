import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Router } from '../../../../api/routes/Router'
import './navTop.html'

const applicationName = Meteor.settings.public.app.title

Template.navTop.helpers({
  applicationName() {
    return applicationName
  },
})

Template.navTop.events({
  'click .logout-button'(event) {
    event.preventDefault()
    Meteor.logout((err) => {
      if (err) return console.error(err)
      Router.go('/')
    })
  },
})
