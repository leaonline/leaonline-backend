import { Meteor } from 'meteor/meteor'
import { RoutesTree } from '../../api/routes/topLevelRoutes'
import { Routes } from '../../api/routes/Routes'

const { hosts } = Meteor.settings.public
const mappedHosts = Object.values(hosts).map(host => {
  return {
    label: host.name,
    args: [ host.short ]
  }
})
RoutesTree.children(Routes.statusOverview.path(), Routes.statusApp, mappedHosts)
