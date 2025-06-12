import { Template } from 'meteor/templating'
import { dataTarget } from '../../../utils/event'
import '../stringified/stringified'
import './preview.scss'
import './preview.html'

const sizes = {
  full: 'full',
  xl: 'xl',
  lg: 'lg',
  default: 'default',
  sm: 'sm',
}

Template.preview.onCreated(function () {
  this.state.set('size', sizes.lg)
})

Template.preview.helpers({
  titleField() {
    const { data } = Template.instance()
    const { titleField, doc } = data
    return titleField && doc && doc[titleField]
  },
  unsaved() {
    const { data } = Template.instance()
    return data.unsaved
  },
  templateTarget() {
    const { data } = Template.instance()
    const { template } = data

    if (!Template[template]) {
      console.warn(
        `[Template.preview]: could not find Template.${template}, use fallback`,
      )
      return 'stringified'
    }

    return template
  },
  templateData() {
    const { data } = Template.instance()
    data.isPreview = true
    data.previewSize = Template.getState('size')
    console.debug(data)
    return data
  },
  size(name) {
    return Template.getState('size') === name
  },
  modalSize() {
    const currentSize = Template.getState('size')
    switch (currentSize) {
      case sizes.full:
        return 'modal-fullscreen'
      case sizes.xl:
        return 'modal-xl'
      case sizes.lg:
        return 'modal-lg'
      case sizes.sm:
        return 'modal-sm'
      case sizes.default:
        return undefined
      default:
        return undefined
    }
  },
})

Template.preview.onRendered(function () {
  this.$('.modal').modal('show')
})

Template.preview.events({
  'click .size-button'(event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    console.debug(target)
    templateInstance.state.set('size', target)
  },
  'hidden.bs.modal'(event, templateInstance) {
    const { onClosed } = templateInstance.data
    if (onClosed) {
      onClosed()
    }
  },
})
