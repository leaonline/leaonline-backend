import { toArray } from '../../utils/toArray'
import { getCollection } from '../../utils/collection'

export const createAddFieldsToQuery = (fieldsResolver, { skipUndefined = true } = {}) => (query, fields) => {
  const fieldsArray = toArray(fields, { objectToEntries: true })
  if (fieldsArray.length === 0) return query

  fieldsArray.forEach(fieldDefinition => {
    const fieldType = typeof fieldDefinition

    if (fieldType === 'string') {
      const fieldValue = fieldsResolver(fieldDefinition)
      if (typeof fieldValue !== 'undefined' || !skipUndefined) {
        query[fieldDefinition] = fieldValue
      }
    } else if (fieldType === 'object') {
      const { type } = fieldDefinition

      // we can resolve a linked document and use its field-values to set them
      // as values for our query. For example:
      // We linked a UnitSet with dimension S and Level A and want now filter
      // all documents from context X, that match these values
      if (type === 'document') {
        const { collection, field, props } = fieldDefinition
        const referenceId = fieldsResolver(field)
        const ReferenceCollection = getCollection(collection)
        const referenceDocument = ReferenceCollection.findOne(referenceId)

        if (!referenceDocument) return

        props.forEach(propertyName => {
          const fieldValue = referenceDocument[propertyName]

          if (typeof fieldValue !== 'undefined' || !skipUndefined) {
            query[propertyName] = fieldValue
          }
        })
      } else {
        throw new TypeError(`[addFieldsToQuery]: fieldType object - subtype [${type}] not yet implemented!`)
      }
    } else {
      throw new TypeError(`[addFieldsToQuery]: fieldType ${fieldType} not yet implemented!`)
    }
  })
}
