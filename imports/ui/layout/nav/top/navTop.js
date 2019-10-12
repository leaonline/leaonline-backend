import './navTop.html'

Template.navTop.events({
  'click .logout-button' (event) {
    event.preventDefault()
    Meteor.logout()
  }
})
