import { Template } from 'meteor/templating'
import '../stringified/stringified'
import './preview.html'
import { dataTarget } from '../../../utils/event'

const sizes = {
  xl: 'xl',
  lg: 'lg',
  default: 'default',
  sm: 'sm'
}

Template.preview.onCreated(function () {
  const instance = this
  instance.state.set('size', sizes.lg)
})

Template.preview.helpers({
  titleField () {
    const { data } = Template.instance()
    const { titleField, doc } = data
    return (titleField && doc && doc[titleField])
  },
  templateTarget () {
    const { data } = Template.instance()
    const { template } = data

    if (!Template[template]) {
      console.warn(`[Template.preview]: could not find Template.${template}, use fallback`)
      return 'stringified'
    }
    return template
  },
  templateData () {
    const { data } = Template.instance()
    return data
  },
  size (name) {
    return Template.getState('size') === name
  },
  modalSize () {
    const size = Template.getState('size')
    switch (size) {
      case sizes.xl:
        return 'modal-xl'
      case sizes.lg:
        return 'modal-lg'
      case sizes.sm:
        return 'modal-sm'
      case sizes.default:
      default:
        return undefined
    }
  }
})

Template.preview.onRendered(function () {
  const instance = this
  instance.$('.modal').modal('show')
})

Template.preview.events({
  'click .size-button' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    templateInstance.state.set('size', target)
  },
  'hidden.bs.modal' (event, templateInstance) {
    const { onClosed } = templateInstance.data
    if (onClosed) {
      onClosed()
    }
  }
})