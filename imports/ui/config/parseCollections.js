import { getCollection } from '../../utils/collection'
import { createFilesCollection } from '../../factories/createFilesCollection'
import { createCollection } from '../../factories/createCollection'

const validateUser = () => !!Meteor.userId()
const defaultLog = () => {}

export const parseCollections = function parseCollections ({ instance, config, connection, logDebug = defaultLog }) {
  instance.collections = instance.collections || new Map()

  // merge all contexts into a single list
  // so we can easily create everything in a row
  const allCollections = (config.dependencies && config.dependencies.length > 0)
    ? [config].concat(config.dependencies)
    : [config].filter(({ isType }) => isType === false)

  allCollections.forEach(collectionConfig => {
    const isFilesCollection = collectionConfig.isFilesCollection
    const collectionName = collectionConfig.name
    const collection = getCollection(collectionName)

    if (collection) {
      instance.collections.set(collectionName, collection)
    } else {
      // create filesCollection if flag is truthy
      const filesCollectionSource = createCollection({
        name: collectionName,
        schema: {},
        connection: connection
      })

      instance.collections.set(collectionName, filesCollectionSource)

      // additionally create files collection
      if (isFilesCollection) {
        createFilesCollection({
          collectionName: collectionName,
          collection: filesCollectionSource,
          ddp: connection,
          maxSize: config.maxSize,
          extension: config.extensions,
          validateUser: validateUser
        })
      }
    }

    // sanity check
    if (!getCollection(collectionName)) {
      throw new Error(`Expected collection to be created by name <${collectionName}>`)
    }
  })
  const mainCollectionName = config.mainCollection || config.name
  instance.mainCollection = instance.collections.get(mainCollectionName)
  logDebug('collections created')
}
