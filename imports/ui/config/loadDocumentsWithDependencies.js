import { StateVariables } from './StateVariables'
import { getDependenciesForContext } from './getDependenciesForContext'
import { callMethod } from '../../utils/callMethod'
import { upsertIntoCollection } from '../../utils/upsertIntoCollection'
import { getCollection } from '../../utils/collection'
import { defaultNotifications } from '../../utils/defaultNotifications'

const defaultLog = () => {}

export const loadDocumentsWithDependencies = function loadDocumentsWithDependencies ({ instance, config, logDebug = defaultLog, onSubscribed, settingsDoc, connection }) {
  const dependencies = getDependenciesForContext(config).filter(dep => !dep.isType).map(dep => ({ name: dep.name }))

  callMethod({
    connection: connection,
    name: config.methods.getAll,
    args: { dependencies },
    failure: error => {
      defaultNotifications(error)
    },
    success: (allDocuments = {}) => {
      // iterate through all documents and assign each to their contexts
      // to ensure we have loaded all dependencies, too
      Object.entries(allDocuments).forEach(([collectionName, documents]) => {
        const collection = getCollection(collectionName)
        upsertIntoCollection(collection, documents)
        logDebug('loaded docs for', collection)
      })

      // we could rewrite this part to use a callback, like onComplete
      // se we can eliminate the dependency to instance entirely here
      if (instance) {
        const count = instance.mainCollection.find().count()
        logDebug(instance.mainCollection, instance.mainCollection.find().fetch())
        instance.state.set(StateVariables.documentsCount, count)
        instance.state.set(StateVariables.allSubsComplete, true)
      }
    }
  })
}
