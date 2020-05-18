import { ContextRegistry } from '../../api/config/ContextRegistry'
import { getCollection } from '../../utils/collection'

export const getPreviewData = function ({ docId, contextName }) {
  const context = ContextRegistry.get(contextName)
  const collection = getCollection(context)
  const doc = collection.findOne(docId)
  const titleField = doc[context.representative]
  const template = 'summary' // TODO dynamic!
  return { doc, template, titleField, context }
}