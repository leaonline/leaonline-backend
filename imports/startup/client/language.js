import { Meteor } from 'meteor/meteor'
import { i18n } from '../../api/i18n/i18n'
import I18N from 'meteor/ostrio:i18n'
import i18nConfig from '../../../resources/i18n/i18n_config'
import i18nDE from '../../../resources/i18n/i18n_de'

const config = {
  settings: i18nConfig,
  de: i18nDE
}

// We first need to create our provider,
// according to it's implementation specifics.
// Then we inject the provider using the
// given interface from our corelib/i18n library.

const i18nProvider = new I18N({ i18n: config })
i18n.load({
  get: i18nProvider.get,
  set: (locale, definitions) => i18nProvider.addl10n({ [locale]: definitions }),
  getLocale: () => i18nProvider.currentLocale.get(),
  thisContext: i18nProvider
})

// provide a language tag on the html root element
// to comply with standards and pwa guidelines

Meteor.startup(() => {
  document.documentElement.setAttribute('lang', 'de')
})
