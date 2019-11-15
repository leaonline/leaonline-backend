import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import './navTop.html'
import { Router } from '../../../../api/routes/Router'

Template.navTop.events({
  'click .logout-button' (event) {
    event.preventDefault()
    Meteor.logout(err => {
      if (err) return console.error(err)
      Router.go('/')
    })
  }
})
