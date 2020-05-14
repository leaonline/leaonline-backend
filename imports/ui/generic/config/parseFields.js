import { StateVariables } from './StateVariables'
import { BackendConfig } from '../../../api/config/BackendConfig'
import { ContextRegistry } from '../../../api/ContextRegistry'
import { getCollection } from '../../../utils/collection'
import { i18n } from '../../../api/i18n/I18n'
import { Template } from 'meteor/templating'

const fieldsFromCollection = function ({ value, collection, context, fieldConfig, path, isArray }) {
  const toDocumentField = entry => {
    const currentDoc = collection.findOne(entry)
    if (!currentDoc) return value
    return {
      value: currentDoc._id,
      label: currentDoc[fieldConfig.dependency.field]
    }
  }

  if (isArray) {
    return { docs: value.map(toDocumentField), isCollection: true, isArray: true, context: context.name }
  } else {
    return { doc: toDocumentField(value), isCollection: true, context: context.name, path }
  }
}

const fieldsFromContext = function ({ context, value }) {
  if (context.isType) {
    const { representative } = context
    const type = Object.values(context.types).find(type => {
      return type[representative] === value
    })
    return Object.assign({}, type, { isType: true })
  }
  return { value }
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

function getFieldResolvers (fieldConfig ) {
  return (value) => {
    const isArray = Array.isArray(value)
    switch (fieldConfig.type) {
      case BackendConfig.fieldTypes.collection:
        const collection = getCollection(fieldConfig.dependency.collection)
        const collectionContext = ContextRegistry.get(fieldConfig.dependency.collection)
        return fieldsFromCollection({ value, fieldConfig, collection, context: collectionContext, isArray })
      case BackendConfig.fieldTypes.context:
        const context = ContextRegistry.get(fieldConfig.dependency.context)
        return fieldsFromContext({ fieldConfig, context, value })
      default:
        return { value }
    }
  }
}

export const parseFields = function parseFields ({ instance, config }) {
  const fieldLabels = {}
  const fieldResolvers = {}
  const fields = {}
  const schema = Object.assign({}, config.schema)
  const excludeFromList = new Set()
  const parentKeyInSet = key => {
    const split = key.split('.')
    if (!split || split.length < 2) {
      return false
    }
    return excludeFromList.has(split[0])
  }

  // create fields from schema
  Object.entries(schema).forEach(([key, value]) => {
    // skip all non-public fields and add them to the set
    if (value.list === false) return excludeFromList.add(key)

    // skip if a key is a child-key of a key in the exclude-from-list-set
    if (parentKeyInSet(key)) return

    const fieldConfig = getFieldConfig(config, key, value)

    fields[key] = 1
    fieldLabels[key] = fieldConfig.label
    fieldResolvers[key] = getFieldResolvers(fieldConfig)
  })

  instance.fieldLabels = Object.values(fieldLabels)
  instance.fieldResolvers = fieldResolvers
  instance.state.set(StateVariables.documentFields, Object.keys(fields))
}

export const fieldHelpers = () => ({
  fields (document) {
    const instance = Template.instance()
    const fields = instance.state.get(StateVariables.documentFields)
    return fields && fields.map(key => {
      const value = document[key]
      const resolver = instance.fieldResolvers[key]

      if (!resolver) {
        return value
      } else {
        return resolver(value)
      }
    })
  },
  fieldLabels () {
    return Template.instance().fieldLabels
  }
})