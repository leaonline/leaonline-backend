import { Routes } from '../../api/routes/Routes'
import { Router } from '../../api/routes/Router'
import '../../ui/pages/loading/loading'

const defaultTarget = 'main-render-target'

Router.titlePrefix(`lea.online - `)
Router.loadingTemplate('loading')

Object
  .values(Routes)
  .map(route => {
    route.target = (route.target || defaultTarget)
    return route
  })
  .forEach(route => Router.register(route))

Template.registerHelper('next', function (...args) {
  args.pop()
  debugger
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