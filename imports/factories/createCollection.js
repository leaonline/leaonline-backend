import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import { Schema } from '../api/schema/Schema'
import { addCollection } from '../utils/collection'

const factory = createCollectionFactory({
  schemaFactory: Schema.create
})

export const createCollection = (def, collectionName) => {
  const collection = factory(def)

  // to support local collections we need to store them to make them accessicble
  // via getCollection
  if (def.name === null && collectionName) {
    addCollection(collection, collectionName)
  }

  return collection
}
