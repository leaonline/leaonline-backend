import { Template } from 'meteor/templating'
import { Apps } from '../../../api/apps/Apps'
import './overview.html'

Template.statusOverview.helpers({
  apps() {
    return Apps.all().sort((a, b) => a.name.localeCompare(b.name))
  },
  isConnected(app) {
    return app?.status?.connected
  },
  isLoggedIn(app) {
    return app?.login?.successful
  },
})
