import { ReactiveDict } from 'meteor/reactive-dict'

export const RoutesTree = {}

const _routes = new ReactiveDict()
const _map = new Map()

RoutesTree.topLevel = function (name, route) {
  _routes.set(name, JSON.stringify(route))
  _map.set(name, route)
}

RoutesTree.children = function (parentName, route, data = []) {
  if (!_routes.get(parentName)) return
  const parentRoute = _map.get(parentName)
  parentRoute.children = data
  _routes.set(parentName, JSON.stringify(route))
}

RoutesTree.get = function (name) {
  if (name) {
    return _map.get(name)
  }
  return Object.keys(_routes.all()).map((key) => _map.get(key))
}
