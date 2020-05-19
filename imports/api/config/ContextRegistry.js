import { ReactiveDict } from 'meteor/reactive-dict'

export const ContextRegistry = {}

const _contexts = new Map()
const _reactive = new ReactiveDict()

ContextRegistry.add = function (name, context) {
  _contexts.set(name, context)
  _reactive.set(name, true)
}

ContextRegistry.get = function (name) {
  return _reactive.get(name) && _contexts.get(name)
}

ContextRegistry.registered = function (name) {
  return _reactive.get(name)
}
