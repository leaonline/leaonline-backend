import { Template } from 'meteor/templating'
import { dataTarget } from '../../../utils/event'
import { Components } from '../../../api/core/Components'
import {
  wrapEvents,
  wrapHelpers,
  wrapOnCreated,
} from '../../config/backendConfigWrappers'
import '../../components/upload/upload'
import './gallery.html'
import { debounce } from '../../../utils/debounce'

const coreComponentsLoaded = Components.load([Components.template.image])

Template.genericGallery.onCreated(function () {
  this.autorun(() => {
    const data = Template.currentData()
    const { pathname } = window.location
    const lastPath = this.state.get('lastPath')

    if (lastPath !== pathname) {
      this.state.clear()
    }

    wrapOnCreated(this, { data })
    this.state.set('lastPath', pathname)
  })
})

Template.genericGallery.helpers(
  wrapHelpers({
    loadComplete() {
      const instance = Template.instance()
      return coreComponentsLoaded.get() && instance.state.get('allSubsComplete')
    },
    fields(document) {
      const fields = Template.instance().state.get('documentFields')
      return fields.map((name) => document[name])
    },
    count() {
      return Template.instance().state.get('documentsCount') || 0
    },
    files() {
      const instance = Template.instance()
      const search = instance.state.get('search')
      const query = {}
      if (search?.length) {
        query.name = { $regex: search }
      }
      return instance.mainCollection.find(query)
    },
    link(file) {
      const instance = Template.instance()
      const remoteUrl = instance.state.get('remoteUrl')
      const config = Template.instance().data.config()
      return instance.mainCollection.filesCollection.link(
        file,
        config.preview,
        remoteUrl,
      )
    },
    kilobytes(bytes) {
      return Number(bytes / 1000).toFixed(1)
    },
    getIcon(file) {
      if (file.isPDF) return 'file-pdf'
      if (file.isAudio) return 'file-audio'
      if (file.isVideo) return 'file-video'
      if (file.mime.includes('text/')) return 'file-text'
      if (file.mime.includes('zip')) return 'file-archive'
      return 'file'
    },
    // /////////////////////////////////////////////////
    //  Upload
    // /////////////////////////////////////////////////
    actionUpload() {
      return Template.instance().state.get('actionUpload')
    },
    uploadFilesCollection() {
      return Template.instance().mainCollection.filesCollection
    },
    onUploadComplete() {
      const instance = Template.instance()
      return function onUploadComplete(/* error, fileObj */) {
        instance.state.clear()
      }
    },
    // /////////////////////////////////////////////////
    //  Remove
    // /////////////////////////////////////////////////
    actionRemove() {
      return Template.instance().state.get('actionRemove')
    },
    // /////////////////////////////////////////////////
    //  ENTRY SPECIFIC
    // /////////////////////////////////////////////////
    current(_id) {
      return Template.instance().state.get('currentFile') === _id
    },
    selected(_id) {
      return Template.instance().state.get('selectedFile') === _id
    },
  }),
)

Template.genericGallery.events(
  wrapEvents({
    'input .search-input': debounce((event, templateInstance) => {
      const searchValue = event.target.value

      if (searchValue.length >= 2) {
        templateInstance.state.set({ search: searchValue })
      } else {
        const hasSearch = templateInstance.state.get('search')
        if (hasSearch?.length) {
          templateInstance.state.set({ search: null })
        }
      }
    }, 750),
    'mouseenter .figure-img'(event, templateInstance) {
      const currentFile = dataTarget(event, templateInstance)
      templateInstance.state.set({ currentFile })
    },
    'mouseleave .figure-img'(event, templateInstance) {
      const currentFile = dataTarget(event, templateInstance)
      const selectedFile = templateInstance.state.get('selectedFile')
      if (!selectedFile || currentFile !== selectedFile) {
        templateInstance.state.set({ currentFile: null })
      }
    },
    'click .figure-img'(event, templateInstance) {
      event.preventDefault()
      const currentFile = dataTarget(event, templateInstance)
      templateInstance.state.set({ currentFile, selectedFile: currentFile })
    },
    'click .close-preview-button'(event, templateInstance) {
      event.preventDefault()
      templateInstance.state.set({ currentFile: null, selectedFile: null })
    },
  }),
)
