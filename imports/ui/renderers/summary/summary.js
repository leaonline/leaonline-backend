import { Template } from 'meteor/templating'
import { parseFields } from '../../config/fields/parseFields'
import { getDebug } from '../../../utils/getDebug'
import { StateVariables } from '../../config/StateVariables'
import './summary.html'

Template.summary.onCreated(function () {
  const instance = this
  const logDebug = getDebug(instance, false)
  const config = instance.data.context
  parseFields({ instance, config, logDebug })
})

Template.summary.helpers({
  fields () {
    const instance = Template.instance()
    const { doc } = instance.data
    const { fieldLabels } = instance
    const { fieldResolvers } = instance
    const fieldKeys = instance.state.get(StateVariables.documentFields)
    if (!doc || !fieldLabels || !fieldKeys || !fieldResolvers) return

    return fieldKeys.map((key, index) => {
      const label = fieldLabels[index]
      const originalValue = doc[key]
      const resolver = fieldResolvers[key]
      const value = resolver ? resolver(originalValue) : originalValue
      return { key, value, label }
    })
  }
})
