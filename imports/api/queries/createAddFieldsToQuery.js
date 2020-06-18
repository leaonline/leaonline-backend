import { toArray } from '../../utils/toArray'

export const createAddFieldsToQuery = (fieldsResolver, {skipUndefined = true} = {}) => (query, fields) => {
  const fieldsArray = toArray(fields)
  if (fieldsArray.length === 0) return query

  fieldsArray.forEach(fieldDefinition=> {
    const fieldType = typeof fieldDefinition
    if (fieldType === 'string') {
      const fieldValue = fieldsResolver(fieldDefinition)
      if (typeof fieldValue !== 'undefined' || !skipUndefined) {
        query[fieldDefinition] = fieldValue
      }
    } else {
      throw new TypeError(`[addFieldsToQuery]: fieldType ${fieldType} not yet implemented!`)
    }
  })
}