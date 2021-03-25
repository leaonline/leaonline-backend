import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import { Schema } from '../api/schema/Schema'
import { LocalCollections } from 'meteor/leaonline:corelib/collections/LocalCollections'

const factory = createCollectionFactory({
  schemaFactory: Schema.create
})

export const createCollection = (def, collectionName) => {
  const collection = factory(def)

  // to support local collections we need to store them to make them accessicble
  // via getCollection
  if (def.name === null && collectionName) {
    LocalCollections.set(collectionName, collection)
    collection._name = collectionName
  }

  return collection
}
