export const RoutesTree = {}

const _routes = {}

RoutesTree.topLevel = function (name, route) {
  _routes[ name ] = route
}

RoutesTree.children = function (parentName, route, data = []) {
  _routes[ parentName ].children = data.map(entry => {
    const href = route.path(...entry.args)
    return {
      label: entry.label,
      href: href
    }
  })
}

RoutesTree.get = function () {
  return Object.values(_routes)
}
