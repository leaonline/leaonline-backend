import '../../../components/notify/notify'
import './navBottom.html'

Template.navBottom.helpers({
  appVersion () {
    return Meteor.settings.public.app.version
  }
})