import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { Schema } from '../api/schema/Schema'
import { checkPermissions } from '../api/mixins/checkPermissions'

export const createMethod = createMethodFactory({
  schemaFactory: Schema.create,
  mixins: [checkPermissions]
})

export const createMethods = methods => methods.forEach(createMethod)
