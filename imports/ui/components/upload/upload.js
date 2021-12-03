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
  }

  instance.currentUpload = new ReactiveVar()
})

Template.upload.helpers({
  currentUpload () {
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
  },
  selectedFile () {
    return Template.instance().state.get('selectedFile')
  },
  progress () {
    return Template.instance().state.get('progress')
  }
})

Template.upload.events({
  'input .custom-file-input' (event, templateInstance) {
    event.preventDefault()
    const files = event.target.files
    if (!files?.length) return

    const file = files[0]
    const selectedFile = {
      name: file.name,
      type: file.type,
      size: file.size
    }
    templateInstance.state.set({ selectedFile })
  },
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
    templateInstance.currentUpload.set(true)
    templateInstance.state.set({ progress: 0 })

    // upload.on('start', function () {})

    upload.on('error', function (error) {
      console.log(error)
      templateInstance.state.set('uploadError', error)
    })

    upload.on('progress', function (progress) {
      templateInstance.state.set({ progress })
    })

    upload.on('end', function (error, fileObj) {
      setTimeout(() => {
        if (!error) {
          templateInstance.state.set({
            selectedFile: null,
            uploadedFile: fileObj,
            uploadErr: null
          })

        }
        else {
          templateInstance.state.set({
            selectedFile: null,
            uploadedFile: null,
            uploadErr: error
          })
        }
        templateInstance.currentUpload.set(false)

        if (templateInstance.data.onComplete) {
          templateInstance.data.onComplete(error, fileObj)
        }
      }, 1000)
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
