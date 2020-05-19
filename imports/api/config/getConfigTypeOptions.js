import { ViewTypes } from './ViewTypes'
import { i18n } from '../i18n/I18n'

const toOption = type => ({ value: type.name, label: () => i18n.get(type.label) })
const allTypes = Object.values(ViewTypes).map(toOption)

export const getConfigTypeOptions = () => allTypes
