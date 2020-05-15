import { i18n } from '../../../api/i18n/I18n'
import { Meteor } from 'meteor/meteor'
import { ContextRegistry } from '../../../api/ContextRegistry'
import { getCollection } from '../../../utils/collection'
import { cloneObject } from '../../../utils/cloneObject'
import { getValueFunction } from './getValueFunction'

const settings = Meteor.settings.public.editor
const { textAreaThreshold } = settings

// for computed values that depend on certain fields
// we define our requiredFields based on the type value
const isValueField = entry => entry.type === 'field'
const toTypeName = entry => entry.source

// we often want to ensure our required fields are set
// se we define a common helper here
const areAllFieldsSet = fields => fields.every(name => !!AutoForm.getFieldValue(name))


export const toFormSchema = (srcSchema, name) => {
  // first we define all the properties on the copy
  // in order to not change the original schema
  const copy = cloneObject(srcSchema)

  Object.entries(copy).forEach(([key, definitions]) => {
    const autoform = {}

    // if there are computed values we need to
    // get optional required fields and a resolver function
    // that resolves all inputs to values at runtime

    if (definitions.value) {
      const requiredFields = definitions.value.input.filter(isValueField).map(toTypeName)
      const valueFunction = getValueFunction(definitions.value)
      autoform.defaultValue = function () {
        if (areAllFieldsSet(requiredFields)) {
          return valueFunction()
        }
      }
      autoform.disabled = () => areAllFieldsSet(requiredFields) !== true
    }

    // we always hide the _id value as it may be part of the schema
    // but users should never directly edit this value

    if (key === '_id' || definitions.hidden) {
      autoform.type = 'hidden'
    }

    if (isTextArea(definitions)) {
      autoform.type = 'textarea'
    }

    if (definitions.dependency) {
      const { dependency } = definitions
      const { requires, collection, context, field, isArray } = dependency

      // if this field requires other fields to be set
      // we disable it until the required fields are set

      if (requires) {
        const allRequired = Array.isArray(requires) ? requires : [requires]
        autoform.disabled = () => {
          return areAllFieldsSet(allRequired) !== true
        }
      }

      let hasOptions = false

      if (collection) {
        const transform = { sort: { [field]: 1 } }
        const query = dependency.query || {}
        const DependantCollection = getCollection(collection)
        const toOptions = doc => ({ value: doc._id, label: doc[field] })
        const toIndexOptions = (entry, index) => ({ value: index, label: entry })

        autoform.options = () => {
          if (requires) {
            const fieldValue = AutoForm.getFieldValue(requires)
            if (!fieldValue) return []

            // relations between docs are always linked via _id
            // so this should be working for long term, too
            // if we ever need a relation apart from _id in a collection-dep
            // we need to make this configurable

            const queryFieldValue = Array.isArray(fieldValue) ? fieldValue : [fieldValue]
            query._id = { $in: queryFieldValue }

            const docs = DependantCollection.find(query, transform).fetch().map(entry => entry[field])
            return isArray
              ? docs.flat().map(toIndexOptions)
              : docs.map(toIndexOptions)
          }

          const cursor = DependantCollection.find(query, transform)
          if (cursor.count() === 0) return []
          return cursor.fetch().map(toOptions)
        }

        hasOptions = true
      }

      if (context) {
        const DepenantContext = ContextRegistry.get(context)
        const { representative } = DepenantContext
        const toTypeOptions = type => ({ value: type[representative], label: () => i18n.get(type.label) })
        const typeOptions = Object.values(DepenantContext.types).map(toTypeOptions)
        autoform.options = () => typeOptions
        hasOptions = true
      }

      // then apply first option for all dep-types that require
      // a select component, like collection and context

      if (hasOptions) {
        autoform.firstOption = () => i18n.get('form.selectOne')
      }
    }

    const labelType = typeof definitions.label
    if (labelType === 'undefined') {
      definitions.label = `${name}.${key}`
    }

    definitions.label = i18n.get(definitions.label)
    definitions.autoform = autoform
  })

  return copy
}

const isTextArea = value => value.type === String && typeof value.max === 'number' && value.max >= textAreaThreshold


