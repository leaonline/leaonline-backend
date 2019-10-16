import { BackendConfig } from 'meteor/leaonline:interfaces/BackendConfig'
import { createLoginTrigger } from '../routes/triggers'
import { RoutesTree } from '../routes/topLevelRoutes'
import { Routes } from '../routes/Routes'
import { Router } from '../routes/Router'
import { Apps } from '../apps/Apps'

const loginTrigger = createLoginTrigger(Routes.login)

const notFoundTemplate = async function () {
  return import('../../ui/pages/notfound/notFound')
}

const listTemplate = async function () {
  return import('../../ui/generic/list/list')
}

const getTemplate = type => {
  switch (type) {
    case BackendConfig.types.list:
      return {
        templateName: 'genericList',
        loadFunction: listTemplate
      }
    default:
      return {
        templateName: 'notFound',
        loadFunction: notFoundTemplate
      }
  }
}

const createRoute = (appName, config, parentRoute) => {
  const template = getTemplate(config.type)
  return {
    path: () => `/${config.name}`,
    icon: config.icon,
    label: config.label,
    triggersEnter: () => [
      loginTrigger,
    ],
    async load () {
      return template.loadFunction()
    },
    target: null,
    template: template.templateName,
    roles: null,
    args: [],
    data: {
      app () {
        return Apps.get(appName)
      },
      config () {
        return config
      },
      top () {
        return parentRoute || Routes.dashboard
      }
    }
  }
}

BackendConfig.parent = function (name, config) {
  Routes[ name ] = createRoute(name, config, null)
  RoutesTree.topLevel(name, Routes[ name ])
  Router.register(Routes[ name ])
}

BackendConfig.children = function (name, config) {
  let parentRoute = Routes[ name ]
  if (!parentRoute) {
    throw new Error(`Could not find any parent for name ${name}`)
  }

  const { content } = config

  const childRoutes = content.map(entry => {
    const fullName = `${name}/${entry.name}`
    const route = createRoute(name, Object.assign({}, entry, { name: fullName }), parentRoute)
    Router.register(route)
    return route
  })
  RoutesTree.children(name, parentRoute, childRoutes)
}

export { BackendConfig }