import { Schema } from '../../api/schema/Schema'
import { StateVariables } from './StateVariables'
import { LeaCoreLib } from '../../api/core/LeaCoreLib'
import { getCollection } from '../../utils/collection'
import { toFormSchema } from './toFormSchema'

export const parseActions = function parseActions ({ instance, config, logDebug, settingsDoc }) {
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
    const insertFormSchema = toFormSchema(actions.insert.schema || schema, config.name, settingsDoc)
    instance.actionInsertSchema = Schema.create(insertFormSchema)
    instance.state.set(StateVariables.actionInsert, actions.insert)
  }

  if (actions.update) {
    const updateFormSchema = toFormSchema(actions.update.schema || schema, config.name, settingsDoc)
    instance.actionUpdateSchema = Schema.create(updateFormSchema)
    instance.state.set(StateVariables.actionUpdate, actions.update)
  }

  if (config.isFilesCollection) {
    const uploadAction = getUploadAction(config)
    instance.state.set(StateVariables.actionUpload, uploadAction)
  }
}

function getUploadAction (context) {
  return {
    fileId: {
      type: 'String',
      autoform: {
        type: 'fileUpload',
        collection: context.name,
        accept: context.accept
      }
    }
  }
}