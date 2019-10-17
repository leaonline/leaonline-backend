import { Template } from 'meteor/templating'
import { createCollection } from '../../../factories/createCollection'
import { getCollection } from '../../../utils/collection'
import { createFilesCollection } from '../../../factories/createFilesCollection'
import { dataTarget } from '../../../utils/event'
import '../../components/upload/upload'
import './gallery.html'

const debug = (...args) => {
  if (Meteor.isDevelopment) {
    console.info('[Template.genericList]', ...args)
  }
}

const actionSchemas = {}

Template.genericGallery.onCreated(function () {
  const instance = this

  const app = instance.data.app()
  const { connection } = app
  instance.state.set('remoteUrl', app.url)

  const config = instance.data.config()
  debug(config)

  const actions = config.actions || {}
  instance.state.set('actionRemove', actions.remove)
  instance.state.set('actionUpload', actions.upload)
  instance.state.set('documentFields', Object.keys(config.fields || {}))

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

Template.genericGallery.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('allSubsComplete')
  },
  fields (document) {
    const fields = Template.instance().state.get('documentFields')
    return fields.map(name => document[name])
  },
  count () {
    return Template.instance().state.get('documentsCount') || 0
  },
  files () {
    const instance = Template.instance()
    return instance.mainCollection.find()
  },
  link (file) {
    const instance = Template.instance()
    const remoteUrl = instance.state.get('remoteUrl')
    return instance.mainCollection.filesCollection.link(file, 'original', remoteUrl)
  },
  // /////////////////////////////////////////////////
  //  Upload
  // /////////////////////////////////////////////////
  actionUpload () {
    return Template.instance().state.get('actionUpload')
  },
  uploadFilesCollection () {
    return Template.instance().mainCollection.filesCollection
  },
  // /////////////////////////////////////////////////
  //  Remove
  // /////////////////////////////////////////////////
  actionRemove () {
    return Template.instance().state.get('actionRemove')
  }
})

Template.genericGallery.events({
  'click .remove-button' (event, templateInstance) {
    event.preventDefault()
    const _id = dataTarget(event, templateInstance)
    const file = templateInstance.mainCollection.findOne(_id)

    if (!file || !confirm(`Really delete ${file.name}?`)) {
      return
    }

    const removeContext = templateInstance.state.get('actionRemove')
    const { method } = removeContext
    const app = templateInstance.data.app()
    const { connection } = app

    connection.call(method, { _id }, (err, res) => {
      console.log(err, res)
    })
  }
})