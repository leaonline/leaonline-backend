import { i18n } from '../../api/i18n/i18n'

export const getOptionsFromSchema = ({ schema, name = 'common' }) => Object.entries(schema).map(([key, value]) => {
  const entry = { value: key }
  const labelType = typeof value.label
  if (labelType === 'function') {
    entry.label = value.label
  } else if (labelType === 'string') {
    entry.label = () => i18n.get(value.label)
  } else {
    const label = `${name}.${key}`
    entry.label = () => i18n.get(label)
  }
  return entry
})
