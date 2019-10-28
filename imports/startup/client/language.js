import { i18n } from '../../api/i18n/I18n'
import { LeaCoreLib } from '../../api/core/LeaCoreLib'
import i18nConfig from '../../../resources/i18n/i18n_config'
import i18nDE from '../../../resources/i18n/i18n_de' // TODO load from backend

const config = {
  settings: i18nConfig,
  de: i18nDE
}

i18n.load(config)
LeaCoreLib.i18n.load(i18n)

Meteor.startup(() => {
  document.documentElement.setAttribute('lang', 'de')
})
