import { BackendConfig } from 'meteor/leaonline:interfaces/BackendConfig'
import { createLoggedinTrigger, createLoginTrigger, createNotFoundTrigger } from '../routes/triggers'
import { RoutesTree } from '../routes/topLevelRoutes'
import { Routes } from '../routes/Routes'
import { i18n } from '../i18n/I18n'

const loggedInTrigger = createLoggedinTrigger(Routes.login)

const createRoute = (config) => {
  return {
    path: () => `/${config.name}`,
    icon: config.icon,
    label: config.label,
    triggersEnter: () => [
      loggedInTrigger,
    ],
    async load () {
      return import('../../ui/pages/notfound/notFound')
    },
    target: null,
    template: 'notFound',
    roles: null,
    args: [],
    data: {
      config() {
        return config
      },
      top () {
        return Routes.dashboard
      }
    }
  }
}

BackendConfig.parent = function (name, config) {
  Routes[name] = createRoute(config)
  RoutesTree.topLevel(name, Routes[name])
}

BackendConfig.children = function (name, config) {
  let parentRoute = Routes[name]
  if (!parentRoute) {
    throw new Error(`Could not find any parent for name ${name}`)
  }

  const { content } = config

  const childRoutes = content.map(entry => {
    const fullName = `${name}/${entry.name}`
    return createRoute(Object.assign({}, entry, { name: fullName }))
  })
  RoutesTree.topLevel(name, parentRoute)
  RoutesTree.children(name, parentRoute, childRoutes)
}

export { BackendConfig }