import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { getCollection } from '../../../utils/collection'
import { dataTarget } from '../../../utils/event'
import { Components } from '../../../api/core/Components'
import { wrapEvents, wrapHelpers, wrapOnCreated } from '../../config/backendConfigWrappers'
import '../../components/upload/upload'
import './gallery.html'

const debug = (...args) => {
  if (Meteor.isDevelopment) {
    console.info('[Template.genericList]', ...args)
  }
}

const coreComponentsLoaded = Components.load([Components.template.image])

Template.genericGallery.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()
    const { pathname } = window.location
    const lastPath = instance.state.get('lastPath')
    if (lastPath !== pathname) {
      instance.state.clear()
    }
    wrapOnCreated(instance, { data, debug: true })
    instance.state.set('lastPath', pathname)
  })
})

Template.genericGallery.helpers(wrapHelpers({
  loadComplete () {
    const instance = Template.instance()
    return coreComponentsLoaded.get() && instance.state.get('allSubsComplete')
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
    return coreComponentsLoaded.get() && instance.mainCollection.find()
  },
  link (file) {
    console.log(file)
    const instance = Template.instance()
    const remoteUrl = instance.state.get('remoteUrl')
    const config = Template.instance().data.config()
    return instance.mainCollection.filesCollection.link(file, config.preview, remoteUrl)
  },
  kilobytes (bytes) {
    return Number(bytes / 1000).toFixed(1)
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
  },
  // /////////////////////////////////////////////////
  //  ENTRY SPECIFIC
  // /////////////////////////////////////////////////
  current (_id) {
    return Template.instance().state.get('currentFile') === _id
  },
  selected (_id) {
    return Template.instance().state.get('selectedFile') === _id
  }
}))

Template.genericGallery.events(wrapEvents({
  'mouseenter .figure-img' (event, templateInstance) {
    const currentFile = dataTarget(event, templateInstance)
    templateInstance.state.set({ currentFile })
  },
  'mouseleave .figure-img' (event, templateInstance) {
    const currentFile = dataTarget(event, templateInstance)
    const selectedFile = templateInstance.state.get('selectedFile')
    if (!selectedFile || currentFile !== selectedFile) {
      templateInstance.state.set({ currentFile: null })
    }
  },
  'click .figure-img' (event, templateInstance) {
    event.preventDefault()
    const currentFile = dataTarget(event, templateInstance)
    templateInstance.state.set({ currentFile, selectedFile: currentFile })
  },
  'click .close-preview-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set({ currentFile: null, selectedFile: null })
  }
}))
