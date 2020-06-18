import { Apps } from '../apps/Apps'
import { Routes } from './Routes'
import { createLoginTrigger } from './triggers'
import { notFoundTemplate } from '../config/notFoundTemplate'

const loginTrigger = createLoginTrigger(Routes.login)

export const createRoute = (appName, config, parentRoute) => {
  const view = config.viewType || notFoundTemplate()
  const path = config.path || appName
  return {
    path: () => `/${path}`,
    key: config.name,
    icon: config.icon,
    label: config.label,
    triggersEnter: () => [
      loginTrigger
    ],
    load: view.load,
    target: null,
    template: view.template,
    roles: null,
    args: [],
    data: {
      app () {
        return Apps.get(appName)
      },
      config () {
        return config
      },
      settings () {
        return Apps.collection().findOne({ name: appName, context: config.name })
      },
      top () {
        return parentRoute || Routes.dashboard
      }
    }
  }
}
