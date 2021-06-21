/* global AutoForm */
import { i18n } from '../../api/i18n/i18n'
import { Meteor } from 'meteor/meteor'
import { ContextRegistry } from '../../api/config/ContextRegistry'
import { getCollection } from '../../utils/collection'
import { cloneObject } from '../../utils/cloneObject'
import { getValueFunction } from './getValueFunction'
import { getLabel } from './fields/getLabel'
import { getFieldSettings } from '../../api/apps/getFieldSettings'
import { FormTypes } from '../forms/FormTypes'
import { Apps } from '../../api/apps/Apps'
import { createAddFieldsToQuery } from '../../api/queries/createAddFieldsToQuery'
import { Schema } from '../../api/schema/Schema'
import { StateVariables } from './StateVariables'

const settings = Meteor.settings.public.editor

// for computed values that depend on certain fields
// we define our requiredFields based on the type value
const isValueField = entry => entry.type === 'field'
const toTypeName = entry => entry.source
const byName = (a, b) => a.localeCompare(b)
const withMinus = ' - '

// we often want to ensure our required fields are set
// se we define a common helper here
const areAllFieldsSet = fields => fields.every(name => !!AutoForm.getFieldValue(name))

const addFieldsToQuery = createAddFieldsToQuery(AutoForm.getFieldValue)

const loadTargetForm = ({ targetForm, instance, fieldSettings }) => {
  const formTypesStatus = instance.state.get(StateVariables.formTypesLoaded) || {}

  if (!targetForm.loaded) {
    formTypesStatus[fieldSettings.form] = false
    instance.state.set(StateVariables.formTypesLoaded, formTypesStatus)

    targetForm.load()
      .then(() => {
        const fts = instance.state.get(StateVariables.formTypesLoaded)
        fts[fieldSettings.form] = true
        instance.state.set(StateVariables.formTypesLoaded, fts)
      })
      .catch(e => {
        console.error(e)
        instance.state.set(StateVariables.formTypesLoaded, null)
      })
  } else {
    formTypesStatus[fieldSettings.form] = true
    instance.state.set(StateVariables.formTypesLoaded, formTypesStatus)
  }
}

// use to map tokens to AutoForm options
const toIndexedTokens = (token, index) => ({
  value: index,
  label: token
})

export const toFormSchema = ({ schema, config, settingsDoc, app, instance, formId }) => {
  const { name } = config

  // first we define all the properties on the copy
  // in order to not change the original schema
  const copy = cloneObject(schema)

  Object.entries(copy).forEach(([key, definitions]) => {
    definitions.label = getLabel({
      key,
      context: config,
      field: definitions,
      type: 'form'
    })

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

    if (isRichText(definitions)) {
      autoform.type = 'markdown'
    }

    if (isRegExp(definitions)) {
      autoform.type = 'regexp'
      FormTypes.regExp.load()
      // autoform.translate = (...) => i18n.get(..)
    }

    if (isMediaUrl(definitions)) {
      definitions.type = Schema.provider.RegEx.Url
      autoform.type = 'url'
    }

    if (isBoolean(definitions)) {
      autoform.type = 'boolean-select'
      autoform.falseLabel = () => i18n.get('common.no')
      autoform.trueLabel = () => i18n.get('common.yes')
      autoform.nullLabel = () => i18n.get('form.selectOne')
    }

    if (isMultiple(definitions)) {
      autoform.type = 'select2'
      autoform.afFieldInput = { multiple: true, tags: true }
    }

    if (isPageContent(definitions)) {
      autoform.type = FormTypes.taskContent.template
      autoform.connection = app.connection
      autoform.app = app.name
      autoform.load = { field: name => AutoForm.getFieldValue(name) }

      Object.assign(autoform, definitions.dependency)
      loadTargetForm({
        targetForm: FormTypes.taskContent,
        instance: instance,
        fieldSettings: fieldSettings
      })
    }

    if (isSettingsForm(fieldSettings)) {
      // we check for the targeted form and load it dynamically in case it's
      // not loaded yet
      const targetForm = FormTypes[fieldSettings.form]
      loadTargetForm({
        targetForm,
        instance,
        fieldSettings
      })

      autoform.type = targetForm.template
      autoform.connection = app.connection
      autoform.app = app.name
      autoform.settingsDoc = Object.assign({}, settingsDoc)
      Object.assign(autoform, definitions.dependency)
    }

    if (definitions.dependency) {
      const { dependency } = definitions
      const { requires, collection, filesCollection, context, field, isArray, filter } = dependency

      // make all fields to Array structure by default so we can make all
      // operations base on iterations and save us the complex if-branchings
      const depFields = Array.isArray(field) ? field : [field]

      let hasOptions = false

      if (collection) {
        const transform = { sort: {} }
        depFields.forEach(f => {
          transform.sort[f] = 1
        })

        const query = dependency.query || {}

        let DependantCollection = getCollection(collection)

        const toDepLabel = doc => depFields
          .map(f => doc[f])
          .sort(byName)
          .join(withMinus)

        const toOptions = doc => ({
          value: doc._id,
          label: toDepLabel(doc)
        })
        const toIndexOptions = (entry, index) => ({
          value: index,
          label: entry
        })

        autoform.options = function () {
          AutoForm.getFormId() // trigger reactivity

          // if in any case the dependant collection has not been loaded initially
          // we can try to load it here, again and re-check it and falling back if necessary
          if (!DependantCollection) {
            DependantCollection = getCollection(collection)
          }

          // TODO raise warning to user?
          if (!DependantCollection) {
            console.error(`Undefined collection: ${collection}`)
            console.error(ContextRegistry.get(collection))
            console.error(ContextRegistry.get(name))
            const formId = AutoForm.getFormId()
            AutoForm.addStickyValidationError(formId, key, 'errors.collectionNotFound', collection)
            return []
          }

          if (requires) {
            const fieldValue = AutoForm.getFieldValue(requires)
            if (fieldValue) return []

            // relations between docs are always linked via _id
            // so this should be working for long term, too
            // if we ever need a relation apart from _id in a collection-dep
            // we need to make this configurable

            const queryFieldValue = Array.isArray(fieldValue) ? fieldValue : [fieldValue]
            query._id = { $in: queryFieldValue }

            const docs = DependantCollection.find(query, transform).fetch().map(entry => toDepLabel(entry))
            return isArray
              ? docs.flat().map(toIndexOptions)
              : docs.map(toIndexOptions)
          }

          // if the context has defined a filter.fields in it's dependencies
          // we use the current field value and add it to the query to filter options

          if (filter?.fields) {
            addFieldsToQuery(query, filter.fields)
          }

          // we can set a filter on the options to have a certain field being
          // set to be the _id of the current edited document.
          // If the current document does not exist (e.g. insertForm) we
          // allow all values in order to support haveing this field to be set
          // with at least an initial value
          if (filter?.self) {
            const formData = AutoForm.getCurrentDataForForm()
            if (formData?.doc) {
              query[filter.self] = formData?.doc._id
            }
          }

          const cursor = DependantCollection.find(query, transform)
          if (cursor.count() === 0) {
            return []
          }

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
        const valueField = definitions.dependency.valueField || (Array.isArray(DependantContext.representative) ? DependantContext.representative[0] : DependantContext.representative)
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

              if (!label) label = index + 1
              if (!value) value = index

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

    // on explicit options we need to handle them separately

    if (definitions.options) {
      const optionsType = typeof definitions.options

      // the default case is an array, which is mapped into options
      if (Array.isArray(definitions.options)) {
        const mappedOptions = definitions.options.map(option => ({
          value: option.value || option.name,
          label: () => i18n.get(option.label)
        }))
        autoform.options = () => mappedOptions

        // if the function has already been declared we do not do any
        // further processing
        // eslint-ignore-next-line
      } else if (optionsType === 'function') {
        autoform.options = definitions.options

        // the more complex case is where options are, for example, computed
        // by a certain method and input
        // eslint-ignore-next-line
      } else if (optionsType === 'object') {
        const tokenize = getValueFunction(definitions.options)
        autoform.options = function () {
          const tokens = tokenize()
          return tokens
            ? tokens.map(toIndexedTokens)
            : []
        }

        // and throw if we really don't know what the type is
        // eslint-ignore-next-line
      } else {
        throw new Error(`Unknown definition for options: ${definitions.options}`)
      }

      // in any case we need to define a first option property
      autoform.firstOption = definitions.optional
        ? () => i18n.get('form.selectOne')
        : false
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
const isRichText = value => value.richText === true
const isPageContent = value => value.isPageContent === true
const isMediaUrl = value => value.isMediaUrl === true
const isTextArea = value => value.type === String && !isRichText(value) && typeof value.max === 'number' && value.max >= textAreaThreshold
const isRegExp = ({ type }) => type === RegExp
const isBoolean = ({ type }) => type === Boolean
const isMultiple = ({ type, dependency }) => type === Array && dependency
const isSettingsForm = ({ form }) => form && FormTypes[form]
