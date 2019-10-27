import I18N from 'meteor/ostrio:i18n'

let _translator

export const i18n = {}

i18n.load = function (config) {
  _translator = new I18N({ i18n: config })
  return _translator
}

i18n.get = function (...params) {
  return _translator.get(...params)
}

i18n.add = function (locale, config) {
  const l10n = { [ locale ]: config }
  _translator.addl10n(l10n)
}

i18n.set = function (lang, options) {
  return _translator.addl10n({ [ lang ]: options })
}

i18n.getLocale = function () {
  return _translator.currentLocale.get()
}

i18n.localeDateOptions = function () {
  const localeKey = i18n.getLocale()
  const config = _translator.langugeSet()
  return config.all.find(enty => enty.code === localeKey).isoCode
}