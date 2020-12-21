import { ContextRegistry } from '../../../api/config/ContextRegistry'

export const resolveFieldFromContext = ({ fieldConfig, value }) => {
  const context = ContextRegistry.get(fieldConfig.dependency.context)
  if (context.isType) {
    const { representative } = context
    const type = Object.values(context.types).find(type => {
      return type[representative] === value
    })
    return Object.assign({}, type, { isType: true })
  }
  return { value }
}
