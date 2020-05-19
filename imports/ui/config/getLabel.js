import { Apps } from '../../api/apps/Apps'

const getFallbackLabel = (config, key) => `${config.name}.${key}`

export const getLabel = ({ key, context, field }) => {
  const type = context.type
  const labelType = typeof field.label

  if (!Apps.settings.fieldIncluded(field) || !Apps.settings.labelIncluded(field)) {
      return false
  }

  // default for undefined labels
  if (labelType === 'undefined') {
    return getFallbackLabel(context, key)
  }

  // label is explicitly set
  if (labelType === 'string') {
    return field.label
  }

  // label is globally excluded
  if (field.label === null || field.label === false) {
    return false
  }

  // if label has complex definition
  if (labelType === 'object') {
    const name = field.label.name || getFallbackLabel(context, key)
    const typeDef = field.label[type]
    return typeDef !== false ? name : false
  }

  throw new Error(`Unexpected label definition: ${label.toString()}`)
}
