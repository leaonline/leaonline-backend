import { i18n } from '../../api/i18n/i18n'

/**
 * Generates translated options from a schema object.
 * @param schema
 * @param name
 * @param includeKey
 * @return {{value: *}[]}
 */
export const getOptionsFromSchema = ({ schema, name = 'common', includeKey = false }) => Object.entries(schema).map(([key, value]) => {
  const entry = { value: key }
  const labelType = typeof value.label
  const withKey = str => includeKey ? `${key} - ${str}` : str

  if (labelType === 'function') {
    entry.label = withKey(value.label)
  } else if (labelType === 'string') {
    entry.label = () => withKey(i18n.get(value.label))
  } else {
    const label = `${name}.${key}`
    entry.label = () => withKey(i18n.get(label))
  }
  return entry
})
