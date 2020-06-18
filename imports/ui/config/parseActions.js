import { Schema } from '../../api/schema/Schema'
import { StateVariables } from './StateVariables'
import { getCollection } from '../../utils/collection'
import { toFormSchema } from './toFormSchema'
import { TaskRenderers } from '../../api/task/TaskRenderers'

const cleanOptions = {
  filter: false,
  autoConvert: false,
  removeEmptyStrings: false,
  trimStrings: false,
  getAutoValues: true,
  removeNullsFromArrays: true
}

export const parseActions = function parseActions ({ instance, config, app, logDebug, settingsDoc }) {
  const actions = config.methods || {}
  const schema = Object.assign({}, config.schema || {})

  if (actions.remove) {
    instance.state.set(StateVariables.actionRemove, actions.remove)
  }

  if (settingsDoc.previewType) {
    const renderer = TaskRenderers.get(settingsDoc.previewType)
    if (renderer) {
      renderer.load()
        .then(() => {
          instance.state.set(StateVariables.actionPreview, renderer)
        })
        .catch(e => logDebug(`failed loading renderer <${settingsDoc.previewType}>`, e))
    } else {
      logDebug(new Error(`no renderer found for ${settingsDoc.previewType}`))
    }
  }

  if (actions.insert) {
    const insertFormSchemaDef = actions.insert.schema || schema
    const insertFormSchema = toFormSchema({ schema: insertFormSchemaDef, config, settingsDoc, app })
    instance.actionInsertSchema = Schema.create(insertFormSchema, { clean: cleanOptions })
    instance.state.set(StateVariables.actionInsert, actions.insert)
  }

  if (actions.update) {
    const updateFormSchemaDef = actions.update.schema || schema
    const updateFormSchema = toFormSchema({ schema: updateFormSchemaDef, config, settingsDoc, app })
    instance.actionUpdateSchema = Schema.create(updateFormSchema, { clean: cleanOptions })
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
