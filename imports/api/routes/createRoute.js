import { Apps } from '../apps/Apps'
import { Routes } from './Routes'
import { createLoginTrigger } from './triggers'
import { getTemplate } from '../config/getTemplate'

const loginTrigger = createLoginTrigger(Routes.login)

export const createRoute = (appName, config, parentRoute) => {
  const view = getTemplate(config.type)
  return {
    path: () => `/${config.path}`,
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
      top () {
        return parentRoute || Routes.dashboard
      }
    }
  }
}

