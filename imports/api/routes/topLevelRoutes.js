import { ReactiveDict } from 'meteor/reactive-dict'

/**
 * A simple data structure to store the top level routes and their children.
 * @type {{}}
 */
export const RoutesTree = {}

const _routes = new ReactiveDict()
const _map = new Map()

/**
 * Adds a top level route to the tree.
 * @param name {string} The name of the route, e.g. 'home'
 * @param route {object} The route object, e.g. { path: '/', name: 'home', ... }
 */
RoutesTree.topLevel = (name, route) => {
  _routes.set(name, JSON.stringify(route))
  _map.set(name, route)
}

/**
 * Adds child routes to a top level route.
 * @param parentName
 * @param route
 * @param data
 */
RoutesTree.children = (parentName, route, data = []) => {
  if (!_routes.get(parentName)) return
  const parentRoute = _map.get(parentName)
  parentRoute.children = data
  _routes.set(parentName, JSON.stringify(route))
}

/**
 * Reactive. Gets a top level route by name, or all top level routes if no name is provided.
 * @param name
 * @return {any[]|any}
 */
RoutesTree.get = (name) => {
  if (name) {
    return _map.get(name)
  }
  return Object.keys(_routes.all()).map((key) => _map.get(key))
}
