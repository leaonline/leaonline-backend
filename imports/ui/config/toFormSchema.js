import { i18n } from '../../api/i18n/i18n'
import { Meteor } from 'meteor/meteor'
import { ContextRegistry } from '../../api/config/ContextRegistry'
import { getCollection } from '../../utils/collection'
import { cloneObject } from '../../utils/cloneObject'
import { getValueFunction } from './getValueFunction'
import { getLabel } from './getLabel'
import { getFieldSettings } from '../../api/apps/getFieldSettings'
import { FormTypes } from '../forms/FormTypes'
import { Apps } from '../../api/apps/Apps'

const settings = Meteor.settings.public.editor

// for computed values that depend on certain fields
// we define our requiredFields based on the type value
const isValueField = entry => entry.type === 'field'
const toTypeName = entry => entry.source

// we often want to ensure our required fields are set
// se we define a common helper here
const areAllFieldsSet = fields => fields.every(name => !!AutoForm.getFieldValue(name))

export const toFormSchema = ({ schema, config, settingsDoc, app }) => {
  const { name } = config

  // first we define all the properties on the copy
  // in order to not change the original schema
  const copy = cloneObject(schema)

  Object.entries(copy).forEach(([key, definitions]) => {
    definitions.label = getLabel({ key, context: config, field: definitions, type: 'form' })

    const fieldSettings = getFieldSettings(settingsDoc, key) || {}
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

    if (isRegExp(definitions)) {
      autoform.type = 'regexp'
      FormTypes.regExp.load()
      // autoform.translate = (...) => i18n.get(..)
    }

    if (isBoolean(definitions)) {
      autoform.type = 'boolean-select'
      autoform.falseLabel = () => i18n.get('common.no')
      autoform.trueLabel = () => i18n.get('common.yes')
      autoform.nullLabel = () => i18n.get('form.selectOne')
    }

    if (isSettingsForm(fieldSettings)) {
      const targetForm = FormTypes[fieldSettings.form]
      targetForm.load()
      autoform.type = targetForm.template
      autoform.connection = app.connection
      autoform.app = app.name
      autoform.settingsDoc = Object.assign({}, settingsDoc)
      Object.assign(autoform, definitions.dependency)
    }

    if (definitions.dependency) {
      const { dependency } = definitions
      const { requires, collection, filesCollection, context, field, isArray, filter } = dependency

      let hasOptions = false

      if (collection) {
        const transform = { sort: { [field]: 1 } }
        const query = dependency.query || {}

        let DependantCollection = getCollection(collection)
        const toOptions = doc => ({ value: doc._id, label: doc[field] })
        const toIndexOptions = (entry, index) => ({ value: index, label: entry })

        autoform.options = () => {
          // if in any case the dependant collection has not been loaded initially
          // we can try to load it here, again and re-check it and falling back if necessary
          if (!DependantCollection) {
            DependantCollection = getCollection(collection)
            if (!DependantCollection) {
              // TODO raise warning to user?
              console.warn(`Undefined collection: ${collection}`)
              const formId = AutoForm.getFormId()
              AutoForm.addStickyValidationError(formId, key, 'errors.collectionNotFound', collection)
              return []
            }
          }

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


          // if the context has defined a filter.byField in it's dependencies
          // we use the current field value and add it to the query to filter options

          const optionsFilterField = filter?.byField
          if (optionsFilterField) {
            const optionsFilterValue = AutoForm.getFieldValue(optionsFilterField)
            if (optionsFilterValue) {
              query[optionsFilterField] = optionsFilterValue
            }
          }

          const cursor = DependantCollection.find(query, transform)
          if (cursor.count() === 0) return []
          return cursor.fetch().map(toOptions)
        }

        hasOptions = true
      }

      if (filesCollection) {
        // if we have a pure image collection
        // we can use the imageFiles template
        if (definitions.dependency.isImage) {
          autoform.type = FormTypes.imageSelect.template
          autoform.imagesCollection = filesCollection
          autoform.version = 'original' // TODO get from context definitions
          autoform.save = definitions.dependency.save || 'url'
          autoform.uriBase = Apps.getUriBase(app)
        }
      }

      if (typeof context !== 'undefined') {
        const DependantContext = context ? ContextRegistry.get(context) : config
        const valueField = definitions.dependency.valueField || DependantContext.representative
        const labelField = definitions.dependency.labelField || 'label'

        if (DependantContext.isItem) {
          autoform.options = () => {
            const entries = AutoForm.getFieldValue(field)
            if (!entries || entries.length === 0) return []
            return entries.map((entry, index) => {
              let value = entry[valueField]
              let label = entry[labelField]
              if (valueField === '@index') {
                value = index
              }
              if (labelField === '@index') {
                label = index
              }
              return { value, label }
            })
          }
        }

        if (DependantContext.isType) {
          const typeOptions = Object.values(DependantContext.types).map(type => ({
            value: type[valueField],
            label: () => i18n.get(type[labelField])
          }))
          autoform.options = () => typeOptions
        }

        hasOptions = true
      }

      // then apply first option for all dep-types that require
      // a select component, like collection and context

      if (hasOptions) {
        autoform.firstOption = () => i18n.get('form.selectOne')
      }

      // if this field requires other fields to be set
      // we disable it until the required fields are set

      if (requires) {
        const allRequired = Array.isArray(requires) ? requires : [requires]
        autoform.disabled = () => {
          return areAllFieldsSet(allRequired) !== true
        }
      }
    }

    // grouping similar fields together by schema attribute "group"

    if (definitions.group) {
      autoform.group = definitions.group
    }

    // on explicit options we map them directly

    if (definitions.options) {
      const mappedOptions = definitions.options.map(option => ({
        value: option.value || option.name,
        label: () => i18n.get(option.label)
      }))
      autoform.options = () => mappedOptions
      autoform.firstOption = definitions.optional ? () => i18n.get('form.selectOne') : false
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

const { textAreaThreshold } = settings
const isTextArea = value => value.type === String && typeof value.max === 'number' && value.max >= textAreaThreshold
const isRegExp = ({ type }) => type === RegExp
const isBoolean = ({ type }) => type === Boolean
const isSettingsForm = ({ form }) => form && FormTypes[form]
