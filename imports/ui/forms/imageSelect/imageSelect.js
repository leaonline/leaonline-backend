import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Mongo } from 'meteor/mongo'
import './autoform'
import './imageSelect.css'
import './imageSelect.html'

const SaveType = {
  id: 'id',
  url: 'url'
}

const StateVariables = {
  saveType: 'saveType',
  galleryMode: 'galleryMode',
  selectedImage: 'selectedImage'
}

Template.afImageSelect.onCreated(function () {
  const instance = this
  instance.stateVars = new ReactiveDict()
  const { data } = instance
  const { atts } = data

  const imagesCollection = Mongo.Collection.get(atts.imagesCollection)
  if (!imagesCollection) {
    throw new Error(`Could not find imagesCollection by name <${atts.imagesCollection}>`)
  }
  instance.imagesCollection = imagesCollection

  const saveType = (atts.save === SaveType.url)
    ? SaveType.url
    : SaveType.id
  instance.stateVars.set(StateVariables.saveType, saveType)

  if (data.value) {
    let valueDoc = instance.imagesCollection.findOne(data.value)
    if (!valueDoc) {
      const split = data.value.split('/')
      const last = split[split.length - 1]
      const noExtSplit = last.split('.')
      valueDoc = instance.imagesCollection.findOne(noExtSplit[0])
    }
    setTimeout(() => {
      updateTarget(valueDoc._id, instance)
    }, 100)
  }

  instance.stateVars.set('invalid', atts.class && atts.class.indexOf('invalid') > -1)
  instance.stateVars.set('disabled', Object.prototype.hasOwnProperty.call(atts, 'disabled'))
  instance.stateVars.set('dataSchemaKey', atts['data-schema-key'])
})

Template.afImageSelect.onDestroyed(function () {
  const instance = this
  instance.stateVars.clear()
})

Template.afImageSelect.helpers({
  dataSchemaKey () {
    return Template.instance().stateVars.get('dataSchemaKey')
  },
  images () {
    return Template.instance().imagesCollection.find()
  },
  galleryMode () {
    return Template.instance().stateVars.get(StateVariables.galleryMode)
  },
  link (doc) {
    const instance = Template.instance()
    const version = instance.data.atts.version
    const uriBase = instance.data.atts.uriBase
    return instance.imagesCollection.filesCollection.link(doc, version, uriBase)
  },
  selectedImage () {
    const instance = Template.instance()
    const imageId = instance.stateVars.get(StateVariables.selectedImage)
    return imageId && instance.imagesCollection.findOne(imageId)
  }
})

Template.afImageSelect.events({
  'click .open-gallery-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.stateVars.set(StateVariables.galleryMode, true)
  },
  'click .close-gallery-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.stateVars.set(StateVariables.galleryMode, false)
  },
  'click .image-select' (event, templateInstance) {
    event.preventDefault()
    const target = templateInstance.$(event.currentTarget).data('target')
    updateTarget(target, templateInstance)
    templateInstance.stateVars.set(StateVariables.galleryMode, false)
  },
  'click .remove-image-button' (event, templateInstance) {
    event.preventDefault()
    updateTarget(null, templateInstance)
  }
})

function updateTarget (targetId, templateInstance) {
  const saveType = templateInstance.stateVars.get(StateVariables.saveType)
  const $hiddenInput = templateInstance.$('.afImageSelectHiddenInput')

  // update the underlying field
  // based on the desired saveType
  if (saveType === SaveType.url) {
    const ImagesFilesCollection = templateInstance.imagesCollection.filesCollection
    const version = templateInstance.data.atts.version
    const uriBase = templateInstance.data.atts.uriBase
    const file = ImagesFilesCollection.findOne(targetId)
    const link = file && file.link(version, uriBase)
    $hiddenInput.val(link)
  } else {
    $hiddenInput.val(targetId)
  }

  // cache selection, in case we reopen the
  // galleryMode view to scroll to the selection
  templateInstance.stateVars.set(StateVariables.selectedImage, targetId)
}
