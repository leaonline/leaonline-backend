/**
 * Returns always an array. If value is an array returns value, otherwise transforms to an array.
 * @param value any value
 * @param includeUndefined set to true to return [undefined] if value is undefined
 * @param includeNull set to true to return [null] if value is null
 * @return {Array}
 */

export const toArray = (value, { includeUndefined = false, includeNull = false } = {}) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'undefined' && !includeUndefined) return []
  if (value === null && !includeNull) return []
  return [value]
}
