import './overview.html'
import { Apps } from '../../../api/apps/Apps'

const { hosts } = Meteor.settings.public
const allApps = Object.values(hosts).map(host => Apps.get(host.short))

Template.statusOverview.onCreated(function () {
  allApps.forEach(app => Apps.connect(app.id))
})

Template.statusOverview.helpers({
  apps () {
    return allApps
  }
})