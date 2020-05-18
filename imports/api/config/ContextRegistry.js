export const ContextRegistry = {}

const _contexts = {}

ContextRegistry.add = function (name, context) {
  _contexts[name] = context
}

ContextRegistry.get = function (name) {
  return _contexts[name]
}
