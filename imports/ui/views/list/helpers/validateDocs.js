import { getCollection } from '../../../../utils/collection'
import { i18n } from '../../../../api/i18n/i18n'

export const validateDocs = instance => {
  // some contexts do not define an insert schema
  if (!instance.actionInsertSchema) return

  const ctx = instance.actionInsertSchema.newContext()
  const validationErrors = {}

  // this is to attach validation errors to the table-entry's first column
  // TODO: translate errors
  instance.mainCollection.find().forEach(doc => {
    const { _id, meta, ...rest } = doc
    ctx.validate(rest)

    if (!ctx.isValid()) {
      validationErrors[_id] = ctx.validationErrors()
    }

    // validate dependency referencing
    instance.fieldLabels.forEach(({ key }) => {
      const config = instance.fieldConfig[key]
      if (!config) return false

      const resolver = config?.resolver
      const fieldValue = resolver ? resolver(doc[key]) : doc[key]

      if (fieldValue === undefined || fieldValue === null) {
        return false
      }

      // however, if we get config, we want to search through dependencies 1st
      if (config.dependency?.collection) {
        const collection = getCollection(config.dependency.collection)
        const dependencyDoc = fieldValue.doc
        if (!dependencyDoc) return false

        const depList = Array.isArray(dependencyDoc)
          ? dependencyDoc
          : [dependencyDoc]

        depList.forEach(depDoc => {
          const id = depDoc._id || depDoc.value
          if (collection.find(id).count() === 0) {
            const field = i18n.get(config.label)
            validationErrors[_id] = validationErrors[_id] || []
            validationErrors[_id].push({
              name: i18n.get('list.validationError'),
              type: i18n.get('document.dependencyNotFound', { field, id })
            })
          }
        })
      }
    })
  })

  instance.state.set({ validationErrors })
}