import { StateVariables } from '../StateVariables'
import { ServiceRegistry } from '../../../api/config/ServiceRegistry'
import { getLabel } from './getLabel'
import { resolveFieldFromContext } from './resolveFieldFromContext'
import { fieldShouldBeExcluded } from './fieldShouldBeExcluded'
import { resolveFieldFromCollection } from './resolveFieldFromCollection'

/**
 * Resolves a single field definition into an immediately usable configuration
 * @private
 * @param config
 * @param key
 * @param field
 * @param fieldSettings
 * @return {*}
 */
function getFieldConfig(config, key, field, fieldSettings) {
  const fieldConfig = Object.assign({}, field, fieldSettings)
  fieldConfig.label = getLabel({ key, context: config, field: fieldConfig })

  if (field.dependency) {
    const { dependency } = field

    if (dependency.collection) {
      fieldConfig.type = ServiceRegistry.fieldTypes.collection
    }
    if (dependency.context) {
      fieldConfig.type = ServiceRegistry.fieldTypes.context
    }
  }

  // if the field is not explicitly excluded, we still check, if it should
  // be excluded, due to it's way
  if (
    !fieldConfig.exclude &&
    fieldShouldBeExcluded({ key, type: fieldConfig.type })
  ) {
    fieldConfig.exclude = true
  }

  return fieldConfig
}

/**
 * Returns a resolver handler that returns a respective resolver by the given
 * value at runtime.
 * @param fieldConfig
 * @return {Function}
 */
function getFieldResolver(fieldConfig) {
  const { type, display } = fieldConfig
  return (value) => {
    const isArray = Array.isArray(value)
    switch (fieldConfig.type) {
      case ServiceRegistry.fieldTypes.collection:
        return resolveFieldFromCollection({ value, fieldConfig, isArray })
      case ServiceRegistry.fieldTypes.context:
        return resolveFieldFromContext({ fieldConfig, value })
      default:
        return { value, type, display }
    }
  }
}

/**
 * Creates a field configuration from the given context and settings.
 * A field config consists at least of the following properties:
 *
 *
 *
 * @param instance
 * @param config
 * @param settingsDoc
 */
export const parseFields = function parseFields({
  instance,
  config,
  settingsDoc,
}) {
  const fieldLabels = {}
  const fields = {}

  const schema = Object.assign({}, config.schema)
  const excludeFromList = new Set()
  const parentKeyInSet = (key) => {
    const split = key.split('.')
    if (!split || split.length < 2) {
      return false
    }
    return excludeFromList.has(split[0])
  }

  const transform = { sort: {} }

  // create fields from schema
  Object.entries(schema).forEach(([key, value]) => {
    // skip if a key is a child-key of a key in the exclude-from-list-set
    if (parentKeyInSet(key)) return
    const fieldSettings = settingsDoc.fields?.find(
      (entry) => entry.name === key,
    )
    const fieldConfig = getFieldConfig(config, key, value, fieldSettings)

    if (fieldConfig.sort) {
      transform.sort[key] = fieldConfig.sort
    }

    if (fieldConfig.exclude) {
      excludeFromList.add(key)
      return
    }

    // always attach a value resolver to display the correct value
    fieldConfig.resolver = getFieldResolver(fieldConfig)
    fieldLabels[key] = { key, value: fieldConfig.label }
    fields[key] = fieldConfig
  })

  // the first assignment to {instance.fieldConfig} is in order to keep
  // functions from being purged, which would occur if assigned to reactive vars
  instance.fieldConfig = fields

  // we also assign labels to skip repetitive Object.values calls
  instance.fieldLabels = Object.values(fieldLabels)

  // however to ensure reactivity we still assign the updated values to state
  instance.state.set(StateVariables.documentFields, Object.keys(fields))

  // if fields define a sort property, we actually add it to the transform var
  // by default we sort by date and by
  instance.state.set({ transform })
}
