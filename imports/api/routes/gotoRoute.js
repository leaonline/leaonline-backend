import { Router } from './Router'
import { RoutesTree } from './topLevelRoutes'

export const gotoRoute = ({ appName, contextName }) => {
  const { children } = RoutesTree.get(appName)
  const route = children.find(el => el.key === contextName)
  const path = route.path()
  Router.go(path)
}
