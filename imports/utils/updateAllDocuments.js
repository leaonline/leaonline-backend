import { upsertIntoCollection } from './upsertIntoCollection'
import { defaultNotifications } from './defaultNotifications'
import { getCollection } from './collection'

export const updateAllDocuments = ({ connection, context, onComplete }) => {
  connection.call(context.methods.getAll.name, {}, (err, res) => {
    defaultNotifications(err, res)
      .success(function (result) {
        const docs = result[context.name]
        const collection = getCollection(context.name)
        upsertIntoCollection(collection, docs)
        if (onComplete) onComplete(docs)
      })
  })
}