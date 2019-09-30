import { Meteor } from 'meteor/meteor'
import { RoutesTree } from '../../api/routes/topLevelRoutes'
import { Routes } from '../../api/routes/Routes'
import { Apps } from '../../api/apps/Apps'

const { hosts } = Meteor.settings.public
const allHosts = Object.values(hosts)

allHosts.forEach(host => {
  Apps.register({ id: host.short, name: host.name, url: host.url, icon: host.icon })
})

const mappedHosts = allHosts.map(host => {
  return {
    label: host.name,
    args: [ host.short ]
  }
})
RoutesTree.children(Routes.statusOverview.path(), Routes.statusApp, mappedHosts)
