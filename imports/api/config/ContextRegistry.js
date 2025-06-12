import { ReactiveDict } from 'meteor/reactive-dict'

export const ContextRegistry = {}

const _contexts = new Map()
const _reactive = new ReactiveDict()

ContextRegistry.add = (name, context) => {
  _contexts.set(name, context)
  _reactive.set(name, true)
}

ContextRegistry.get = (name) => _reactive.get(name) && _contexts.get(name)

ContextRegistry.registered = (name) => _reactive.get(name)
