/**
 * Iterates all documents for a search term.
 * @param value {String} the raw search value
 * @param collection {Mongo.Collection}
 * @param fieldLabels {Object} resolver object
 * @param fieldConfig {Object} config for fields
 * @return {[String]} array of ids of documents that matches the search criteria
 */
export const getSearchIds = ({ value, collection, fieldLabels, fieldConfig }) => {
  const originalValue = value.trim()
  const lowerCaseValue = value.trim().toLocaleLowerCase()

  return collection
    .find()
    .map(doc => {
      const found = fieldLabels.some(({ key }) => {
        const config = fieldConfig[key]

        // if we can't find a config for the the given key we can skip early
        if (!config) {
          return false
        }

        // if we haven't found something, let's try to resolve some field values
        // and see if their resolved values contain the search value
        const resolver = config?.resolver
        let fieldValue = resolver ? resolver(doc[key]) : doc[key]

        if (fieldValue === undefined || fieldValue === null) {
          return false
        }

        // however, if we get config, we want to search through dependencies 1st
        if (config.dependency) {
          const dependencyDoc = fieldValue.doc
          if (!dependencyDoc) return false

          const docList = Array.isArray(dependencyDoc)
            ? dependencyDoc
            : [dependencyDoc]

          // if we search for an _id and the dependency may have this _id
          // we want to add the parent doc to the list as well
          const dependencyIdFound = docList.some(depDoc => {
            return (depDoc._id || depDoc.value) === originalValue
          })

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
        fieldValue = Object.hasOwnProperty.call(fieldValue, 'value')
          ? fieldValue.value
          : fieldValue

        if (config.type === String) {
          return fieldValue && fieldValue.toLowerCase().includes(lowerCaseValue)
        }

        if (config.type === Number) {
          fieldValue.toString().includes(lowerCaseValue)
        }

        // nothing found at all :(
        return false
      })

      return found && doc._id
    })
    .filter(entry => !!entry)
}
