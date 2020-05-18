import { RoutesTree } from './topLevelRoutes'
import { Router } from './Router'
import { Routes } from './Routes'
import { createRoute } from './createRoute'

export const createChildRoute = (name, config) => {
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
