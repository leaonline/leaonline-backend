import { Apps } from '../../api/apps/Apps'
Apps.debug = true
const { hosts } = Meteor.settings.public
const allHosts = Object.values(hosts)
allHosts.forEach(host => Apps.register(host))

Tracker.autorun(() => {
  if (!Meteor.userId() || !Meteor.user()) return
  console.info('logged in')
})