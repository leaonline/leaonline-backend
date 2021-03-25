import { getCollection as _originalGetCollection } from 'meteor/leaonline:corelib/utils/collection'
import { LocalCollections } from '../factories/LocalCollections'

/**
 * gets a collection by name. Searches in local collections first and
 * otherwise via Mongo.Collection.get
 * @param name
 * @return {*}
 */
export const getCollection = name => {
  if (LocalCollections.has(name)) {
    return LocalCollections.get(name)
  }

  return _originalGetCollection(name)
}
