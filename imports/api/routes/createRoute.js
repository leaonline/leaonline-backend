import { getTemplate } from '../config/getTemplate'
import { Apps } from '../apps/Apps'
import { Routes } from './Routes'
import { createLoginTrigger } from './triggers'

const loginTrigger = createLoginTrigger(Routes.login)

export const createRoute = (appName, config, parentRoute) => {
  const template = getTemplate(config.type)
  return {
    path: () => `/${config.path}`,
    icon: config.icon,
    label: config.label,
    triggersEnter: () => [
      loginTrigger
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
