import { StateVariables } from './StateVariables'
import { ServiceRegistry } from '../../api/config/ServiceRegistry'
import { ContextRegistry } from '../../api/config/ContextRegistry'
import { getCollection } from '../../utils/collection'
import { i18n } from '../../api/i18n/i18n'
import { Template } from 'meteor/templating'
import { cloneObject } from '../../utils/cloneObject'
import { getLabel } from './getLabel'

const fieldsFromCollection = function ({ value, collection, context, fieldConfig, path, isArray }) {
  const depField = fieldConfig.dependency.field
  const toDocumentField = entry => {
    const currentDoc = collection.findOne(entry)
    if (!currentDoc) return value

    return {
      value: currentDoc._id,
      label: (Array.isArray(depField)
        ? depField.map(entry => currentDoc[entry]).join(' ')
        : currentDoc[depField])
    }
  }

  const fields = {}
  fields.isCollection = true
  fields.context = context.name

  if (isArray) {
    fields.doc = value.map(toDocumentField)
    fields.isArray = true
  } else {
    fields.doc = toDocumentField(value)
    fields.path = path
  }

  return fields
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

function getFieldConfig (config, key, field, fieldSettings) {
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

  return fieldConfig
}

function getFieldResolvers (fieldConfig) {
  const { type } = fieldConfig
  return (value) => {
    const isArray = Array.isArray(value)
    switch (fieldConfig.type) {
      case ServiceRegistry.fieldTypes.collection:
        const collection = getCollection(fieldConfig.dependency.collection)
        const collectionContext = ContextRegistry.get(fieldConfig.dependency.collection)
        return fieldsFromCollection({ value, fieldConfig, collection, context: collectionContext, isArray })
      case ServiceRegistry.fieldTypes.context:
        const context = ContextRegistry.get(fieldConfig.dependency.context)
        return fieldsFromContext({ fieldConfig, context, value })
      default:
        return { value, type }
    }
  }
}

export const parseFields = function parseFields ({ instance, config, settingsDoc }) {
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
    // skip if a key is a child-key of a key in the exclude-from-list-set
    if (parentKeyInSet(key)) return

    const fieldSettings = settingsDoc.fields && settingsDoc.fields.find(entry => entry.name === key)
    const fieldConfig = getFieldConfig(config, key, value, fieldSettings)

    if (fieldConfig.exclude) {
      excludeFromList.add(key)
      return
    }



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
