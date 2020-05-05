import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import { Schema } from '../api/schema/Schema'

export const createCollection = createCollectionFactory({
  schemaFactory: Schema.create
})
