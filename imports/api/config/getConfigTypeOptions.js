import { ServiceRegistry } from './ServiceRegistry'
import { i18n } from '../i18n/I18n'

const toOption = type => ({ value: type, label: () => i18n.get(`serviceRegistry.types.${type}`) })
const allTypes = Object.values(ServiceRegistry.types).map(toOption)

export const getConfigTypeOptions = () => allTypes
