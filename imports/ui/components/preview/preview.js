import { Template } from 'meteor/templating'
import '../stringified/stringified'
import './preview.html'

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
  }
})

Template.preview.onRendered(function () {
  const instance = this
  instance.$('.modal').modal('show')
})

Template.preview.events({
  'hidden.bs.modal' (event, templateInstance) {
    const { onClosed } = templateInstance.data
    if (onClosed) {
      onClosed()
    }
  }
})