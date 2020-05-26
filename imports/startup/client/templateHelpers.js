import { Template } from 'meteor/templating'
import { i18n } from '../../api/i18n/i18n'

Template.registerHelper('toDate', function (date) {
  const options = i18n.localeDateOptions()
  return date && new Date(date).toLocaleDateString(options)
})
