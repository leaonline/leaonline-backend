import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { getCollection } from '../../../utils/collection'
import { dataTarget } from '../../../utils/event'
import { LeaCoreLib } from '../../../api/core/LeaCoreLib'
import { wrapEvents, wrapHelpers, wrapOnCreated } from '../../config/backendConfigWrappers'
import '../../components/upload/upload'
import './gallery.html'

const debug = (...args) => {
  if (Meteor.isDevelopment) {
    console.info('[Template.genericList]', ...args)
  }
}

const components = LeaCoreLib.components
const coreComponentsLoaded = components.load([components.template.image])

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
}))

Template.genericGallery.events(wrapEvents({}))
