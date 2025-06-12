import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Routes } from '../../api/routes/Routes'
import { RoutesTree } from '../../api/routes/topLevelRoutes'
import { Router } from '../../api/routes/Router'
import { loadingTemplate } from '../../ui/pages/loading/loading'

const defaultTarget = 'main-render-target'

Router.titlePrefix('lea.backend - ')
Router.loadingTemplate(loadingTemplate)
Router.defaultTarget(defaultTarget)

const allRoutes = Object.values(Routes)
for (const route of allRoutes) {
  route.target = route.target || defaultTarget
  Router.register(route)
}

const topLevel = [
  Routes.statusOverview,
  // Routes.settings
]
for (const route of topLevel) {
  RoutesTree.topLevel(route.path(), route)
}

Template.registerHelper('next', (...args) => {
  args.pop()
  const instance = Template.instance()
  const route = instance?.data.next()
  const path = route?.path(...args)
  return Meteor.absoluteUrl(path)
})

Template.registerHelper('route', (name, ...args) => {
  console.debug('args', args)
  args.pop()
  const route = Routes[name]
  if (!route) return
  const path = route.path(...args)
  return Meteor.absoluteUrl(path)
})

Template.registerHelper(
  'activeRoute',
  (path) => window.location.pathname === path,
)
