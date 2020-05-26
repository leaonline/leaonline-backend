import { Tracker } from 'meteor/tracker'
import { ServiceRegistry } from '../config/ServiceRegistry'
import SimpleSchema from 'simpl-schema'
import { onClient } from '../../utils/arch'

const schemaOptions = Object.keys(ServiceRegistry.schemaOptions)
schemaOptions.push('autoform')

SimpleSchema.extendOptions(schemaOptions)

export const Schema = {}

Schema.create = function (schemaDefinition, options) {
  const fullOptions = Object.assign({}, options, onClient({ tracker: Tracker }))
  return new SimpleSchema(schemaDefinition, fullOptions)
}
