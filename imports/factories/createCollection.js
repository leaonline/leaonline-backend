import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import { Schema } from '../api/schema/Schema'
import { LocalCollections } from './LocalCollections'

const factory = createCollectionFactory({
  schemaFactory: Schema.create
})

export const createCollection = (def, collectionName) => {
  const collection = factory(def)

  if (def.name === null && collectionName) {
    LocalCollections.set(collectionName, collection)
  }

  return collection
}
