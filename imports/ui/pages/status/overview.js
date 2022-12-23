import { Template } from 'meteor/templating'
import { Apps } from '../../../api/apps/Apps'
import './overview.html'

Template.statusOverview.helpers({
  apps () {
    return Apps.all()
  },
  isConnected (app) {
    return app?.status?.connected
  },
  isLoggedIn (app) {
    console.debug(app)
    return app?.login?.successful
  }
})
