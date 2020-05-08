import { Tracker } from 'meteor/tracker'
import { SchemaOptions } from 'meteor/leaonline:interfaces/SchemaOptions'
import SimpleSchema from 'simpl-schema'
import { onClient } from '../../utils/arch'

const schemaOptions = Object.keys(SchemaOptions)
schemaOptions.push('autoform')

SimpleSchema.extendOptions(schemaOptions)

export const Schema = {}

Schema.create = function (schemaDefinition, options) {
  return new SimpleSchema(schemaDefinition, Object.assign({}, options, onClient({ tracker: Tracker })))
}
