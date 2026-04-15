import { RoutesTree } from './topLevelRoutes'
import { Router } from './Router'
import { Routes } from './Routes'
import { createRoute } from './createRoute'
import { isEdtableContext } from '../config/isEditableContext'

const keepEditableContexts = (context) =>
  isEdtableContext(context) || context.isType

/**
 * Creates child routes for a given parent route and registers them with the Router.
 * Use this for creating child routes at runtime, e.g. for the registered apps.
 * @param name
 * @param config
 */
export const createChildRoute = (name, config) => {
  const parentRoute = Routes[name]
  if (!parentRoute) {
    throw new Error(`Could not find any parent for name ${name}`)
  }

  const { content } = config

  // first, check if the app supports remote-db-queries

  // create child routes for the content of the app, but only for the editable contexts
  const childRoutes = content.filter(keepEditableContexts).map((entry) => {
    const path = `${name}/${entry.name}`
    const copy = Object.assign({}, entry, { path })
    const route = createRoute(name, copy, parentRoute)
    Router.register(route)
    return route
  })
  RoutesTree.children(name, parentRoute, childRoutes)
}
