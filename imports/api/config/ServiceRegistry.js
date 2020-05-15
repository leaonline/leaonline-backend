import { ServiceRegistry } from 'meteor/leaonline:service-registry'
import { createLoginTrigger } from '../routes/triggers'
import { RoutesTree } from '../routes/topLevelRoutes'
import { Routes } from '../routes/Routes'
import { Router } from '../routes/Router'
import { Apps } from '../apps/Apps'
import { JSONReviver } from './JSONReviver'
import { ContextRegistry } from '../ContextRegistry'

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

const typeViewTemplate = async function () {
  return import('../../ui/generic/typeView/typeView')
}

const getTemplate = type => {
  switch (type) {
    case ServiceRegistry.types.list:
      return {
        templateName: 'genericList',
        loadFunction: listTemplate
      }
    case ServiceRegistry.types.gallery:
      return {
        templateName: 'genericGallery',
        loadFunction: galleryTemplate
      }
    case ServiceRegistry.types.document:
      return {
        templateName: 'genericDocument',
        loadFunction: documentTemplate
      }
    case ServiceRegistry.types.typeView:
      return {
        templateName: 'typeView',
        loadFunction: typeViewTemplate
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

function getConfigType (context) {
  if (context.isFilesCollection) {
    return ServiceRegistry.types.gallery
  }
  if (context.isConfigDoc) {
    return ServiceRegistry.types.document
  }
  if (context.isType) {
    return ServiceRegistry.types.typeView
  }
  return ServiceRegistry.types.list
}

/**
 * This transforms the config from the app to a more usable structure.
 * At first it revives the stringified schema, because JSON does not support the schema constructors
 * (String, Number etc...) so we use our custom reviver for that.
 * Next we denormalize dependencies because at this stage it is cheap to do so.
 * If we would do this on the template level, the template would have to deal with information
 * it usually not can easily retrieve.
 */

ServiceRegistry.parse = (config) => {
  config.content = config.content.map(JSONReviver.revive)
  const toContext = name => config.content.find(context => context.name === name)
  config.content.forEach(context => {
    context.type = context.type || getConfigType(context)

    if (context.dependencies && context.dependencies.length > 0) {
      context.dependencies = context.dependencies.map(toContext)
    }

    ContextRegistry.add(context.name, context)
  })
}

ServiceRegistry.parent = function (name, config) {
  Routes[name] = createRoute(name, config, null)
  RoutesTree.topLevel(name, Routes[name])
  Router.register(Routes[name])
}

ServiceRegistry.children = function (name, config) {
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

export { ServiceRegistry }
