import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import './upload.html'

const defaultInsertOpts = {
  meta: {},
  isBase64: false,
  transport: 'ddp',
  chunkSize: 'dynamic',
  allowWebWorkers: false
}

Template.upload.onCreated(function () {
  const instance = this

  if (!instance.data.filesCollection) {
    throw new Error('Upload impossible without FilesCollection')
  } else {
    console.info(instance.data.filesCollection)
  }

  instance.currentUpload = new ReactiveVar()
})

Template.upload.helpers({
  currentUpload () {
    console.log(Template.instance().currentUpload.get())
    return Template.instance().currentUpload.get()
  },
  uploadError () {
    return Template.instance().state.get('uploadError')
  },
  uploadedFile () {
    return Template.instance().state.get('uploadedFile')
  },
  uploadForm () {
    const instance = Template.instance()
    return !instance.state.get('uploadError') &&
      !instance.state.get('uploadedFile') &&
      !instance.currentUpload.get()
  }
})

Template.upload.events({
  'click .upload-button' (event, templateInstance) {
    event.preventDefault()

    const insertConfig = templateInstance.state.get('insertConfig')
    const files = templateInstance.$('#list-file-upload')[0].files

    if (!files) {
      console.warn('[Template.upload] skip attempt to upload without file')
      return
    }

    const opts = Object.assign({}, defaultInsertOpts, insertConfig, {
      file: files[0]
    })

    const upload = templateInstance.data.filesCollection.insert(opts, false)

    upload.on('start', function () {
      templateInstance.currentUpload.set(this)
    })

    upload.on('error', function (error) {
      console.log(error)
      templateInstance.state.set('uploadError', error)
    })

    upload.on('end', function (error, fileObj) {
      if (!error) {
        templateInstance.state.set('uploadedFile', fileObj)
        templateInstance.state.set('uploadError', null)
      } else {
        templateInstance.state.set('uploadError', error)
        templateInstance.state.set('uploadedFile', null)
      }
      templateInstance.currentUpload.set(false)
    })

    upload.start()
  },
  'click .reset-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('uploadError', null)
    templateInstance.state.set('uploadedFile', null)
    templateInstance.currentUpload.set(false)
  }
})
