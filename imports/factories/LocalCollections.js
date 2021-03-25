export const LocalCollections = {}

const map = new Map()

LocalCollections.set = (key, value) => map.set(key, value)
LocalCollections.get = key => map.get(key)
LocalCollections.has = key => map.has(key)
