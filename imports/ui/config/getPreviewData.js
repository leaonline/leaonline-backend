import { Apps } from '../../api/apps/Apps'
import { ContextRegistry } from '../../api/config/ContextRegistry'
import { getCollection } from '../../utils/collection'

export const getPreviewData = function ({ docId, appName, contextName }) {
  const context = ContextRegistry.get(contextName)
  const collection = getCollection(context)
  const doc = collection.findOne(docId)
  const titleField = doc[context.representative]
  const settingsDoc = Apps.collection().findOne({ name: appName, context: contextName })
  const template = (settingsDoc && settingsDoc.previewType) || 'summary'
  return { doc, template, titleField, context }
}
