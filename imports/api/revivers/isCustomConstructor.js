import { Icon } from 'meteor/leaonline:interfaces/types/Icon'
import { ColorType } from 'meteor/leaonline:interfaces/types/ColorType'

export const isCustomConstructor = (key, value) => {
  if (typeof value !== 'string') return undefined

  switch (value) {
    case 'Icon':
      return Icon
    case 'ColorType':
      return ColorType
    default:
      return undefined
  }
}
