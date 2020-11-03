import { ContextRegistry } from '../../api/config/ContextRegistry'

const toContextByName = dep => (typeof dep === 'string') ? ContextRegistry.get(dep) : dep

const cache = new Map()

export const getDependenciesForContext = context => {
  if (!cache.has(context.name)) {
    const dependencies = (context.dependencies || []).map(toContextByName)
    cache.set(context.name, dependencies)
  }

  return cache.get(context.name)
}
