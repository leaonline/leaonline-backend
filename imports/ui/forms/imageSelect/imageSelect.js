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
  const { data } = instance
  const { atts } = data

  instance.imagesCollection = Mongo.Collection.get(atts.imagesCollection)
  if (!instance.imagesCollection) {
    throw new Error(`Could not find imagesCollection by name <${atts.imagesCollection}>`)
  }

  const saveType = (atts.save === SaveType.url)
    ? SaveType.url
    : SaveType.id
  instance.state.set(StateVariables.saveType, saveType)

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

  instance.state.set('invalid', atts.class && atts.class.indexOf('invalid') > -1)
  instance.state.set('disabled', atts.hasOwnProperty('disabled'))
  instance.state.set('dataSchemaKey', atts[ 'data-schema-key' ])
})

Template.afImageSelect.helpers({
  dataSchemaKey() {
    return Template.instance().state.get('dataSchemaKey')
  },
  images () {
    return Template.instance().imagesCollection.find()
  },
  galleryMode () {
    return Template.instance().state.get(StateVariables.galleryMode)
  },
  link (doc) {
    const instance = Template.instance()
    const version = instance.data.atts.version
    const uriBase = instance.data.atts.uriBase
    return instance.imagesCollection.filesCollection.link(doc, version, uriBase)
  },
  selectedImage () {
    const instance = Template.instance()
    const imageId = instance.state.get(StateVariables.selectedImage)
    console.log(imageId)
    return imageId && instance.imagesCollection.findOne(imageId)
  }
})

Template.afImageSelect.events({
  'click .open-gallery-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set(StateVariables.galleryMode, true)
  },
  'click .close-gallery-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set(StateVariables.galleryMode, false)
  },
  'click .image-select' (event, templateInstance) {
    event.preventDefault()
    const target = templateInstance.$(event.currentTarget).data('target')
    updateTarget(target, templateInstance)
    templateInstance.state.set(StateVariables.galleryMode, false)
  }
})

function updateTarget (targetId, templateInstance) {
  const saveType = templateInstance.state.get(StateVariables.saveType)
  const $hiddenInput = templateInstance.$('.afImageSelectHiddenInput')

  // update the underlying field
  // based on the desired saveType
  if (saveType === SaveType.url) {
    const ImagesFilesCollection = templateInstance.imagesCollection.filesCollection
    const version = templateInstance.data.atts.version
    const uriBase = templateInstance.data.atts.uriBase
    const link = ImagesFilesCollection.findOne(targetId).link(version, uriBase)
    $hiddenInput.val(link)
  } else {
    $hiddenInput.val(targetId)
  }

  // cache selection, in case we reopen the
  // galleryMode view to scroll to the selection
  templateInstance.state.set(StateVariables.selectedImage, targetId)
}
