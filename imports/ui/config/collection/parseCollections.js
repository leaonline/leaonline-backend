import { Meteor } from 'meteor/meteor'
import { getCollection } from '../../../utils/collection'
import { createFilesCollection } from '../../../factories/createFilesCollection'
import { createCollection } from '../../../factories/createCollection'
import { getDependenciesForContext } from '../getDependenciesForContext'

const validateUser = () => !!Meteor.userId()
const defaultLog = () => {}

// TODO use backendconfig, defined by content service
const defaultSchema = {
  _id: String,
  meta: {
    optional: true,
    type: Object,
    blackbox: true
  }
}

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

    // XXX: in order to allow to check for remote users we need to skip
    // the special case of Meteor.users and force to create a local collection
    if (collection && collectionName !== Meteor.users._name) {
      instance.collections.set(collectionName, collection)
    } else {
      const localCollection = createCollection({
        name: null,
        schema: Object.assign({}, config.schema, defaultSchema),
        connection: connection,
        attachSchema: false
      }, collectionName)

      localCollection._name = collectionName

      instance.collections.set(collectionName, localCollection)

      // additionally create files collection
      if (isFilesCollection) {
        createFilesCollection({
          collectionName: collectionName,
          collection: localCollection,
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
