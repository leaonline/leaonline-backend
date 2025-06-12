import { check, Match } from 'meteor/check'
import { Mongo } from 'meteor/mongo'

const exists = (x) => typeof x !== 'undefined' && x !== null

/**
 * Iterates all documents and their dependencies for a search term.
 *
 * @param options {Object} options for this method
 * @param options.value {String} the raw search value
 * @param options.collection {Mongo.Collection}
 * @param options.fieldLabels {Array} resolver object
 * @param options.fieldConfig {Object} config for fields
 * @return {[String]} array of ids of documents that matches the search criteria
 */
export const getSearchIds = (options) => {
  check(
    options,
    Match.ObjectIncluding({
      value: String,
      collection: Mongo.Collection,
      fieldLabels: [Object],
      fieldConfig: Object,
    }),
  )

  const { value = '', collection, fieldLabels, fieldConfig } = options
  const originalValue = value.trim()
  const lowerCaseValue = value.trim().toLocaleLowerCase()

  return collection
    .find()
    .map((doc) => {
      const resolveFieldVales = (key) => {
        const config = fieldConfig[key]

        // if we can't find a config for the the given key we can skip early
        if (!exists(config)) {
          return false
        }

        // get config definitions
        const { resolver, dependency, type } = config

        // if we haven't found something, let's try to resolve some field values
        // and see if their resolved values contain the search value
        const fieldValue = resolver ? resolver(doc[key]) : doc[key]

        // if we have no value definitions, skip
        if (!exists(fieldValue)) {
          return false
        }

        // however, if we get config, we want to search through dependencies 1st
        // if such dependencies exist (not every field is defined as dependency)
        if (exists(dependency)) {
          const dependencyDoc = fieldValue.doc

          // if we have a dependency but no resolved doc we must skip
          if (!exists(dependencyDoc)) {
            return false
          }

          // deps can be multiple or single so we need to unify them to Array
          const docList = Array.isArray(dependencyDoc)
            ? dependencyDoc
            : [dependencyDoc]

          // if we search for an _id and the dependency may have this _id
          // we want to add the parent doc to the list as well
          const dependencyIdFound = docList.some((depDoc) => {
            return (depDoc._id || depDoc.value) === originalValue
          })

          // if the search is a direct _id match we can return true :-)
          if (dependencyIdFound) {
            return true
          }

          // For non-ids we search in the label for the term
          return dependencyDoc.label
            ? String(dependencyDoc.label).toLowerCase().includes(lowerCaseValue)
            : false
        }

        // some simple fields are split into { type, value }
        // so we need to extract their value
        const resolvedValue = Object.hasOwnProperty.call(fieldValue, 'value')
          ? fieldValue.value
          : fieldValue

        // skip early in case we could not resolve the value
        if (!exists(resolvedValue)) {
          return false
        }

        const resolvedType = typeof resolvedValue

        if (type === String && resolvedType === 'string') {
          return resolvedValue.toLowerCase().includes(lowerCaseValue)
        }

        if (type === Number) {
          if (resolvedType === 'number') {
            return Number(resolvedValue).toString(10).includes(lowerCaseValue)
          } else if (resolvedType === 'string') {
            return resolvedValue.includes(lowerCaseValue)
          } else {
            console.warn(
              `Mismatch: expected ${resolvedType} to be Number or String`,
            )
          }
        }

        // nothing found at all :(
        return false
      }

      const found = fieldLabels.some(({ key }) => {
        try {
          return resolveFieldVales(key)
        } catch (e) {
          console.error(e)
          return false
        }
      })
      return found && doc._id
    })
    .filter((entry) => !!entry)
}
