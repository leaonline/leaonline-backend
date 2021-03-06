import { Meteor } from 'meteor/meteor'
import { getCollection } from '../../../utils/collection'
import { createFilesCollection } from '../../../factories/createFilesCollection'
import { createCollection } from '../../../factories/createCollection'
import { getDependenciesForContext } from '../getDependenciesForContext'

const validateUser = () => !!Meteor.userId()
const defaultLog = () => {}

export const parseCollections = function parseCollections ({ instance, config, connection, logDebug = defaultLog }) {
  instance.collections = instance.collections || new Map()

  const dependencies = getDependenciesForContext(config)

  // merge all contexts into a single list
  // so we can easily create everything in a row
  const allCollections = dependencies.length > 0
    ? [config].concat(dependencies)
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

  if (!instance.mainCollection) {
    throw new Error(`Expected mainCollection for ${mainCollectionName}`)
  }

  logDebug('collections created')
}
