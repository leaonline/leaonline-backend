import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { Schema } from '../api/schema/Schema'
import { checkPermissions } from '../api/mixins/checkPermissions'
import { environmentExtensionMixin } from '../api/mixins/environmentExtensionMixin'

export const createMethod = createMethodFactory({
  schemaFactory: Schema.create,
  mixins: [environmentExtensionMixin, checkPermissions],
})

export const createMethods = (methods) => methods.forEach(createMethod)
