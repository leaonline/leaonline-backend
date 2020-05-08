export const isPrimitiveConstructor = (key, value) => {
  if (typeof value !== 'string') return undefined

  switch (value) {
    case 'String':
      return String
    case 'Boolean':
      return Boolean
    case 'RegExp':
      return RegExp
    case 'Number':
      return Number
    case 'Array':
      return Array
    case 'Date':
      return Date
    case 'Object':
      return Object
    default:
      return undefined
  }
}
