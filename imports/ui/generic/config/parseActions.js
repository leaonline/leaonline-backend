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

      if (dependency.collection) {
        const transform = { sort: { [dependency.field]: 1 } }
        const query = dependency.query || {}
        const toOptions = doc => ({ value: doc._id, label: doc[dependency.field] })

        autoform.options = () => {
          const collection = getCollection(dependency.collection)
          return collection
            ? collection.find(query, transform).fetch().map(toOptions)
            : []
        }
      }

      if (dependency.context) {
        const context = ContextRegistry.get(dependency.context)
        const { representative } = context
        const toTypeOptions = type => ({ value: type[representative], label: () => i18n.get(type.label) })
        const typeOptions = Object.values(context.types).map(toTypeOptions)
        autoform.options = () => typeOptions
      }

      // then apply first option for all dep-types
      autoform.firstOption = () => i18n.get('form.selectOne')
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
