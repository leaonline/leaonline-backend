import { StateVariables } from './StateVariables'
import { BackendConfig } from '../../../api/config/BackendConfig'
import { ContextRegistry } from '../../../api/ContextRegistry'
import { getCollection } from '../../../utils/collection'
import { i18n } from '../../../api/i18n/I18n'

const fieldsFromCollection = function ({ value, fieldConfig, isArray }) {
  const collection = getCollection(fieldConfig.dependency.collection)
  if (!collection) return value

  const toDocumentField = entry => {
    const currentDoc = collection.findOne(entry)
    return currentDoc && currentDoc[fieldConfig.dependency.field]
  }

  if (isArray) {
    return value.map(toDocumentField)
  } else {
    return toDocumentField(value)
  }
}

const fieldsFromContext = function ({ fieldConfig, value }) {
  const context = ContextRegistry.get(fieldConfig.context)
  if (!context) return value
  const label = context.helpers.resolveField(value)
  return label && i18n.get(label)
}

const fieldsFromKeyMap = function ({ fieldConfig, value }) {
  const context = ContextRegistry.get(fieldConfig.context)
  const contextValue = context[value]
  if (!contextValue) return value
  const label = contextValue[fieldConfig.srcField]
  return label && i18n.get(label)
}

function getFieldConfig (config, key, field) {
  const fieldConfig = Object.assign({ label: `${config.name}.${key}` }, field)

  if (field.dependency) {
    const { dependency } = field

    if (dependency.collection) {
      fieldConfig.type = BackendConfig.fieldTypes.collection
    }
    if (dependency.context) {
      fieldConfig.type = BackendConfig.fieldTypes.context
    }
  }

  return fieldConfig
}

export const parseFields = function parseFields ({ instance, config, logDebug }) {
  const fieldLabels = {}
  const fieldResolvers = {}
  const fields = {}
  const schema = Object.assign({}, config.schema)
  // create fields from schema
  Object.entries(schema).forEach(([key, value]) => {
    // skip all non-public fields
    if (value.list === false) return

    const fieldConfig = getFieldConfig(config, key, value)

    fields[key] = 1
    fieldLabels[key] = fieldConfig.label

    fieldResolvers[key] = (value) => {
      const isArray = Array.isArray(value)
      switch (fieldConfig.type) {
        case BackendConfig.fieldTypes.collection:
          return fieldsFromCollection({ value, fieldConfig, isArray })
        case BackendConfig.fieldTypes.context:
          return fieldsFromContext({ fieldConfig, value })
        case BackendConfig.fieldTypes.keyMap:
          return fieldsFromKeyMap({ fieldConfig, value })
        default:
          return value
      }
    }
  })

  instance.fieldLabels = Object.values(fieldLabels)
  instance.fieldResolvers = fieldResolvers
  instance.state.set(StateVariables.documentFields, Object.keys(fields))
}
