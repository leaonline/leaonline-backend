import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Routes } from '../../api/routes/Routes'
import { RoutesTree } from '../../api/routes/topLevelRoutes'
import { Router } from '../../api/routes/Router'
import '../../ui/pages/loading/loading'

const defaultTarget = 'main-render-target'

Router.titlePrefix(`lea.online - `)
Router.loadingTemplate('loading')

/**
 * Load all routes definitions into the router
 */

Object
  .values(Routes)
  .map(route => {
    route.target = (route.target || defaultTarget)
    return route
  })
  .forEach(route => Router.register(route))

/**
 * Build to RoutesTree to represent a structured sidebar nav data model
 */
;[
  Routes.dashboard,
  Routes.statusOverview
].forEach(route => RoutesTree.topLevel(route.path(), route))

Template.registerHelper('next', function (...args) {
  args.pop()
  const instance = Template.instance()
  const route = instance && instance.data.next()
  const path = route && route.path(...args)
  return path && Meteor.absoluteUrl(path)
})

Template.registerHelper('route', function (name, ...args) {
  args.pop()
  const route = Routes[ name ]
  if (!route) return
  const path = route.path(...args)
  return Meteor.absoluteUrl(path)
})