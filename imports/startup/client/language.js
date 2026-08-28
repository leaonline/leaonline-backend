import { Meteor } from 'meteor/meteor'
import { i18n } from '../../api/i18n/i18n'
import { Schema } from '../../api/schema/Schema'
import I18N from 'meteor/ostrio:i18n'
import i18nConfig from '../../../resources/i18n/i18n_config'
import i18nDE from '../../../resources/i18n/de/i18n_de'

const config = {
  settings: i18nConfig,
  de: i18nDE,
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
  thisContext: i18nProvider,
})

// provide a language tag on the html root element
// to comply with standards and pwa guidelines

Meteor.startup(() => {
  document.documentElement.setAttribute('lang', 'de')
})

Schema.provider.setDefaultMessages({
  initialLanguage: 'en',
  messages: {
    en: {
      uploadError: i18n.get('form.validation.uploadError', ['{{value}}']), // '{{value}}', //File-upload
      required: i18n.get('form.validation.required', ['{{{label}}}']),
      minString: i18n.get('form.validation.min', ['{{{label}}}', '{{min}}']),
      maxString: i18n.get('form.validation.max', ['{{{label}}}', '{{max}}']),
      minNumber: i18n.get('form.validation.min', ['{{{label}}}', '{{min}}']),
      maxNumber: i18n.get('form.validation.max', ['{{{label}}}', '{{max}}']),
      minNumberExclusive: i18n.get('form.validation.minNumberExclusive', [
        '{{{label}}}',
        '{{min}}',
      ]),
      maxNumberExclusive: i18n.get('form.validation.maxNumberExclusive', [
        '{{{label}}}',
        '{{max}}',
      ]),
      minDate: i18n.get('form.validation.min', ['{{{label}}}', '{{min}}']),
      maxDate: i18n.get('form.validation.max', ['{{{label}}}', '{{max}}']),
      badDate: i18n.get('form.validation.badDate', ['{{{label}}}']),
      minCount: i18n.get('form.validation.min', ['{{minCount}}']),
      maxCount: i18n.get('form.validation.max', ['{{maxCount}}']),
      noDecimal: i18n.get('form.validation.noDecimal', ['{{{label}}}']),
      notAllowed: i18n.get('form.validation.notAllowed', ['{{{value}}}']),
      expectedType: i18n.get('form.validation.expectedType', [
        '{{{label}}}',
        '{{dataType}}',
      ]),
      regEx: i18n.get('form.validation.regExFail'),
      keyNotInSchema: i18n.get('form.validation.keyNotInSchema'['{{label}}']),
      valueAlreadyExists: i18n.get('form.valueAlreadyExists'),
    },
  },
})

Schema.provider.ErrorTypes.VALUE_EXISTS = 'valueAlreadyExists'
