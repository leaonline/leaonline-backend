import { Routes } from './Routes'
import { RoutesTree } from './topLevelRoutes'
import { Router } from './Router'
import { createRoute } from './createRoute'

export const createParentRoute = function (name, config) {
  Routes[name] = createRoute(name, config, null)
  RoutesTree.topLevel(name, Routes[name])
  Router.register(Routes[name])
}
