import { StateVariables } from './StateVariables'
import { getDependenciesForContext } from './getDependenciesForContext'
import { callMethod } from '../../utils/callMethod'
import { upsertIntoCollection } from '../../utils/upsertIntoCollection'
import { getCollection } from '../../utils/collection'
import { defaultNotifications } from '../../utils/defaultNotifications'

const defaultLog = () => {}

export const loadDocumentsWithDependencies = ({ instance, config, logDebug = defaultLog, onSubscribed, settingsDoc, connection }) => {
  const dependencies = getDependenciesForContext(config).filter(dep => !dep.isType).map(dep => ({ name: dep.name }))

  if (config.methods.getAll) {
    callMethod({
      connection,
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
          if (!collection) {
            throw new Error('Collection name is required to upsert docs. Did you only returned docs without collection name?')
          }
          upsertIntoCollection(collection, documents)
          logDebug('loaded docs for', collection)
        })

        // we could rewrite this part to use a callback, like onComplete
        // se we can eliminate the dependency to instance entirely here
        if (instance) {
          const count = instance.mainCollection.find({}, { reactive: false }).count()
          instance.state.set(StateVariables.documentsCount, count)
          instance.state.set(StateVariables.allSubsComplete, true)
        }

        if (onSubscribed) onSubscribed()
      }
    })
  } else if (config.methods.get) {
    // single-doc contexts have only .get method
    callMethod({
      connection,
      name: config.methods.get,
      args: {},
      failure: error => {
        defaultNotifications(error)
      },
      success: document => {
        const collection = getCollection(config.name)
        upsertIntoCollection(collection, [document])

        // we could rewrite this part to use a callback, like onComplete
        // se we can eliminate the dependency to instance entirely here
        if (instance) {
          const count = instance.mainCollection.find().count({}, { reactive: false })
          instance.state.set(StateVariables.documentsCount, count)
          instance.state.set(StateVariables.allSubsComplete, true)
        }

        if (onSubscribed) onSubscribed()
      }
    })
  } else {
    defaultNotifications(new Error(`[${config.name}]: expected one of the following methods: [getAll, getOne, get], got none.`))
  }
}
