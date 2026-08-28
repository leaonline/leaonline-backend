import { i18n } from '../../api/i18n/i18n'

export const transformLabelsToTranslation = (schema) => {
  Object.keys(schema).forEach((key) => {
    const label = schema[key].label
    if (typeof label === 'string') {
      schema[key].label = () => i18n.get(label)
    }
  })
}
