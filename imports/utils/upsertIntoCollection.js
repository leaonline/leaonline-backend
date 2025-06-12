/**
 * Upserts a bunch of documents into a collection. If skipInvalid is truthy
 * it will validate each doc and only inserts, if valid.
 *
 * @param collection
 * @param source
 * @param skipInvalid
 * @param reactive
 */
export const upsertIntoCollection = (
  collection,
  source,
  { skipInvalid, reactive = true } = {},
) => {
  const documents = Array.isArray(source) ? source : [source]

  const ctx = collection.schema.newContext()

  documents.forEach((doc) => {
    console.debug(`[${collection._name}]: upsert`, doc._id)

    try {
      if (skipInvalid) {
        ctx.validate(doc)
        if (!ctx.isValid()) {
          return console.debug(
            'skip doc with validation errors',
            ctx.validationErrors(),
          )
        }
      }

      return collection.findOne(doc._id, { reactive })
        ? collection.update(doc._id, { $set: doc })
        : collection.insert(doc)
    } catch (e) {
      console.error(e)
    }
  })
}
