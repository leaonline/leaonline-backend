import {ReactiveDict} from 'meteor/reactive-dict'

export const RoutesTree = {}

const _routes = new ReactiveDict()
const _map = {}

RoutesTree.topLevel = function (name, route) {
  _routes.set(name, JSON.stringify(route))
  _map[name] = route
}

RoutesTree.children = function (parentName, route, data = []) {
  if (!_routes.get(parentName)) return
  const parentRoute = _map[parentName]
  parentRoute.children = data
  _routes.set(parentName, JSON.stringify(route))
}

RoutesTree.get = function () {
  return Object.keys(_routes.all()).map(key => _map[key])
}
