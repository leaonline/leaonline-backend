import { getCollection } from '../../../utils/collection'
import { ContextRegistry } from '../../../api/config/ContextRegistry'

export const resolveFieldFromCollection = ({
  value,
  fieldConfig,
  path,
  isArray,
}) => {
  const collection = getCollection(fieldConfig.dependency.collection)
  const context = ContextRegistry.get(fieldConfig.dependency.collection)
  const depField = fieldConfig.dependency.field
  const { display } = fieldConfig

  const toDocumentField = (entry) => {
    const currentDoc = collection.findOne(entry)
    if (!currentDoc) {
      return value
    }

    return {
      value: currentDoc._id,
      display,
      label: Array.isArray(depField)
        ? depField.map((entry) => currentDoc[entry]).join(' ')
        : currentDoc[depField],
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
