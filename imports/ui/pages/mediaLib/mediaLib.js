import { MediaLib } from '../../../api/content/medialib/MediaLib'
import { createFilesCollection } from '../../../factories/createFilesCollection'
import { createCollection } from '../../../factories/createCollection'
import { Schema } from '../../../api/schema/Schema'
import './mediaLib.html'

let collection

Tracker.autorun((computation) => {
  const connection = MediaLib.connection()
  if (!connection || !connection.status().connected || !connection.userId()) {
    return
  }
  collection = createCollection({ name: MediaLib.name, schema: MediaLib.schema }, { connection })
  createFilesCollection({ name: MediaLib.name, collection, ddp: connection })
  console.info(`[MediaLib]: collection / filesCollection created`)
  computation.stop()
})

const addFileSchema = Schema.create(MediaLib.upload.schema)

Template.mediaLib.onCreated(function () {
  const instance = this
  instance.autorun(() => {
    const mediaSub = MediaLib.publications.all.subscribe()
    if (mediaSub.ready()) {
      instance.state.set('filesCount', collection.find().count())
      instance.state.set('mediaLoadComplete', true)
    }
  })
})

Template.mediaLib.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('mediaLoadComplete')
  },
  filesCount () {
    return Template.getState('filesCount') || 0
  },
  files( ){
    const instance = Template.instance()
    const filesCount = instance.state.get('filesCount')
    if (!filesCount) return
    return collection.find()
  },

  link(file) {
    const link = collection.filesCollection.link(file)
    return link.replace(/5050/g, '3030')
  },
  addFile () {
    return Template.getState('addFile')
  },
  addFileSchema () {
    return addFileSchema
  }
})

Template.mediaLib.events({
  'click .add-file-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('addFile', true)
  }
})