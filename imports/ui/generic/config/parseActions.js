import { Meteor } from 'meteor/meteor'
import { Schema } from '../../../api/schema/Schema'
import { LeaCoreLib } from '../../../api/core/LeaCoreLib'
import { ContextRegistry } from '../../../api/ContextRegistry'
import { getCollection } from '../../../utils/collection'
import { i18n } from '../../../api/i18n/I18n'
import { StateVariables } from './StateVariables'

const settings = Meteor.settings.public.editor
const { textAreaThreshold } = settings

function toFormSchema (srcSchema, name) {
  const configBefore = JSON.stringify(srcSchema)
  const copy = {}

  // first we define all the properties on the copy
  // and we need to make a pseude-deep copy in order to not
  // change the original config
  Object.entries(srcSchema).forEach(([key, value]) => {
    Object.defineProperty(copy, key, {
      value: Object.assign({}, value),
      writable: true,
      enumerable: true
    })
  })

  Object.entries(copy).forEach(([key, value]) => {
    const autoform = {}

    if (key === '_id' || value.hidden) {
      autoform.type = 'hidden'
    }

    if (value.type === String && typeof value.max === 'number' && value.max >= textAreaThreshold) {
      autoform.type = 'textarea'
    }

    if (value.dependency) {
      const { dependency } = value
      const { requires, collection, context, field, isArray } = dependency

      // if this field requires another field to be set
      // we disable it until the required field is set

      if (requires) {
        autoform.disabled = () => {
          const requiredField = AutoForm.getFieldValue(requires)
          return !requiredField
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

    const labelType = typeof value.label
    if (labelType === 'undefined') {
      value.label = `${name}.${key}`
    }

    value.label = i18n.get(value.label)
    value.autoform = autoform
  })

  return copy
}

export const parseActions = function parseActions ({ instance, config, logDebug }) {
  const actions = config.methods || {}
  const schema = Object.assign({}, config.schema || {})

  if (actions.remove) {
    instance.state.set(StateVariables.actionRemove, actions.remove)
  }

  if (actions.preview) {
    logDebug('load preview', actions.preview.type, actions.preview.name)
    LeaCoreLib[actions.preview.type][actions.preview.name]
      .load()
      .then(() => {
        logDebug('loaded', actions.preview.name)
        instance.state.set(StateVariables.actionPreview, actions.preview)
      })
      .catch(e => console.error(e))
  }

  if (actions.insert) {
    const insertFormSchema = toFormSchema(actions.insert.schema || schema, config.name)
    instance.actionInsertSchema = Schema.create(insertFormSchema)
    instance.state.set(StateVariables.actionInsert, actions.insert)
  }

  if (actions.update) {
    const updateFormSchema = toFormSchema(actions.update.schema || schema, config.name)
    console.log(updateFormSchema)
    instance.actionUpdateSchema = Schema.create(updateFormSchema)
    instance.state.set(StateVariables.actionUpdate, actions.update)
  }

  if (actions.upload) {
    instance.state.set(StateVariables.actionUpload, actions.upload)
  }
}
