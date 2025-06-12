import { Router } from './Router'
import { RoutesTree } from './topLevelRoutes'

export const gotoRoute = ({ path, appName, contextName }) => {
  if (path) {
    return Router.go(path())
  }
  const { children } = RoutesTree.get(appName)
  const route = children.find((el) => el.key === contextName)
  Router.go(route.path())
}
