import { Template } from 'meteor/templating'
import { i18n } from '../../api/i18n/i18n'

Template.registerHelper('toDate', function (date) {
  const options = i18n.localeDateOptions()
  const locale = i18n.getLocale()
  return date && new Date(date).toLocaleDateString(locale, options)
})

Template.registerHelper('eq', function (a, b) {
  return a === b
})

Template.registerHelper('log', function (...args) {
  args.pop()
  console.log(args)
})
