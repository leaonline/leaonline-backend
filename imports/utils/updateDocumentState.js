import { defaultNotifications } from './defaultNotifications'
import { upsertIntoCollection } from './upsertIntoCollection'
import { getCollection } from './collection'

export const updateDocumentState = ({ connection, context, docId, onComplete }) => {
  const method = context.methods.getOne || context.methods.get
  connection.call(method.name, { _id: docId }, (err, doc) => {
    defaultNotifications(err, doc)
      .success(function () {
        const collection = getCollection(context.name)
        upsertIntoCollection(collection, [doc])
        if (onComplete) onComplete(doc)
      })
  })
}
