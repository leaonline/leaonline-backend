import { Template } from 'meteor/templating'
import { createCollection } from '../../../factories/createCollection'
import { getCollection } from '../../../utils/collection'
import { createFilesCollection } from '../../../factories/createFilesCollection'
import '../../components/upload/upload'
import './list.html'

const debug = (...args) => {
  if (Meteor.isDevelopment) {
    console.info('[Template.genericList]', ...args)
  }
}

const actionSchemas = {}

Template.genericList.onCreated(function () {
  const instance = this
  const app = instance.data.app()
  const { connection } = app
  const config = instance.data.config()
  debug(config)

  const actions = config.actions || {}
  if (actions.insert) {
    // TODO
  }
  if (actions.update) {
    // TODO
  }
  if (actions.remove) {
    // TODO
  }
  if (actions.upload) {
    instance.state.set('actionUpload', actions.upload)
  }


  if (config.collections) {
    instance.collections = instance.collections || {}
    config.collections.forEach(collectionName => {
      const collection = getCollection(collectionName)
      if (collection) {
        instance.collections[ collectionName ] = collection
      } else {
        // create filesCollection if flag is truthy
        instance.collections[ collectionName ] = createCollection({
          name: collectionName,
          schema: {}
        }, { connection })
        if (config.isFilesCollection) {
          createFilesCollection({
            collectionName: collectionName,
            collection: instance.collections[ collectionName ],
            ddp: connection
          })
        }
      }
    })
    instance.mainCollection = instance.collections[ config.mainCollection ]
    debug('collections created', instance.collections)
  }

  if (config.publications) {
    const allSubs = {}
    config.publications.forEach(publication => {
      const { name } = publication
      allSubs[ name ] = false
      Tracker.autorun(() => {
        debug('subscribe to', name)
        const sub = connection.subscribe(name)
        if (sub.ready()) {
          allSubs[ name ] = true
          debug(name, 'complete')
        }
        if (Object.values(allSubs).every(entry => entry === true)) {
          debug('all subs complete')
          const count = instance.mainCollection.find().count()
          instance.state.set('documentsCount', count)
          instance.state.set('allSubsComplete', true)
        }
      })
    })
  }
})

Template.genericList.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('allSubsComplete')
  },
  count () {
    return Template.instance().state.get('documentsCount') || 0
  },
  documents () {
    const instance = Template.instance()
    return instance.mainCollection.find()
  },
  // /////////////////////////////////////////////////
  //  Upload
  // /////////////////////////////////////////////////
  actionUpload () {
    return Template.instance().state.get('actionUpload')
  },
  uploadFilesCollection () {
    return Template.instance().mainCollection.filesCollection
  }
})
