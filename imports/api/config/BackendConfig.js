import { BackendConfig } from 'meteor/leaonline:interfaces/BackendConfig'
import { createLoginTrigger } from '../routes/triggers'
import { RoutesTree } from '../routes/topLevelRoutes'
import { Routes } from '../routes/Routes'
import { Router } from '../routes/Router'
import { Apps } from '../apps/Apps'
import { JSONReviver } from './JSONReviver'

const loginTrigger = createLoginTrigger(Routes.login)

const notFoundTemplate = async function () {
  return import('../../ui/pages/notfound/notFound')
}

const listTemplate = async function () {
  return import('../../ui/generic/list/list')
}

const galleryTemplate = async function () {
  return import('../../ui/generic/gallery/genericGallery')
}

const documentTemplate = async function () {
  return import('../../ui/generic/document/document')
}

const getTemplate = type => {
  switch (type) {
    case BackendConfig.types.list:
      return {
        templateName: 'genericList',
        loadFunction: listTemplate
      }
    case BackendConfig.types.gallery:
      return {
        templateName: 'genericGallery',
        loadFunction: galleryTemplate
      }
    case BackendConfig.types.document:
      return {
        templateName: 'genericDocument',
        loadFunction: documentTemplate
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


/**
 * This transforms the config from the app to a more usable structure.
 * At first it revives the stringified schema, because JSON does not support the schema constructors
 * (String, Number etc...) so we use our custom reviver for that.
 * Next we denormalize dependencies because at this stage it is cheap to do so.
 * If we would do this on the template level, the template would have to deal with information
 * it usually not can easily retrieve.
 */

BackendConfig.parse = (config) => {
  config.content = config.content.map(JSONReviver.revive)
  const toContext = name => config.content.find(context => context.name === name)
  config.content.forEach(context => {
    if (!context.dependencies || context.dependencies.length === 0) {
      return
    }

    context.dependencies = context.dependencies.map(toContext)
  })
}

BackendConfig.parent = function (name, config) {
  Routes[name] = createRoute(name, config, null)
  RoutesTree.topLevel(name, Routes[name])
  Router.register(Routes[name])
}

BackendConfig.children = function (name, config) {
  const parentRoute = Routes[name]
  if (!parentRoute) {
    throw new Error(`Could not find any parent for name ${name}`)
  }


  const { content } = config
  const childRoutes = content.map(entry => {
    const path = `${name}/${entry.name}`
    const copy = Object.assign({}, entry, { path })
    const route = createRoute(name, copy, parentRoute)
    Router.register(route)
    return route
  })
  RoutesTree.children(name, parentRoute, childRoutes)
}

export { BackendConfig }
