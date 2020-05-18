import { getCollection } from '../../utils/collection'

/**
 * Returns a function that resolves to a field value at runtime.
 * It's behavior can differ by a given method.
 * @param method The method to use for resolving the field values
 * @param input an array of computation inputs for the given method
 * @return {*} An arbitrary value, depending on the method and input.
 */

export const getValueFunction = ({ method, input }) => {
  const mappedInput = input.map(toExecutableEntry)
  switch (method) {
    case 'concat':
      return getValueConcat(mappedInput)
    default:
      throw new Error(`Unknown method ${method}`)
  }
}

/**
 * Converts all entries into functions.
 * @param entry an input entry describing a value
 * @return {Function}
 */

const toExecutableEntry = entry => {
  switch (entry.type) {
    case 'value':
      return () => entry.value
    case 'field':
      return getDocumentFieldValueResolver(entry)
    case 'increment':
      return getIncrementValueResolver(entry)
    default:
      throw new Error(`Unknown type: ${type}`)
  }
}

/**
 * Returns a function that resolves to a field of an externally linked document
 * @param source The name of the source field that is used to lookup the document
 * @param collection The collection of the document
 * @param field the name of the field on the linked document to use as value
 * @return {function(): (any)}
 */

const getDocumentFieldValueResolver = ({ source, collection, field }) => {
  const Collection = getCollection(collection)
  if (!Collection) throw new Error(`Collection does not exist: ${collection}`)
  return function resolveDocumentFieldValue () {
    const sourceId = AutoForm.getFieldValue(source)
    const doc = Collection.findOne(sourceId)
    return doc && doc[field]
  }
}

/**
 * Returns an incremented counter of the count of a given collection
 * @param decimals the number of overall decimals of the number (allows to add leading zeros)
 * @param collection the name of the collection to get the documents count
 * @return {function(): string}
 */

const getIncrementValueResolver = ({ decimals, collection }) => {
  const Collection = getCollection(collection)
  if (!Collection) throw new Error(`Collection does not exist: ${collection}`)
  return function resolveIcrementValue () {
    const count = Collection.find().count() + 1
    return count.toString().padStart(decimals, '0')

  }
}

/**
 * Returns a function that concatenates to a string from all returned values
 * from each function in the input array.
 * @param input an array of Functions that each resolve to a value at runtime
 * @return {function(): *}
 */

const getValueConcat = input => () => input.reduce((a, b) => `${a}${b()}`, '')
