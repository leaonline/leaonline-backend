import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { Schema } from '../api/schema/Schema'

export const createMethod = createMethodFactory({
  schemaFactory: Schema.create
})

export const createMethods = methods => methods.forEach(createMethod)
