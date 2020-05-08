import { i18n } from '../i18n/I18n'

export const isLabel = (key, value) => {
  if (key === 'label') {
    return () => i18n.get(value)
  }
}
