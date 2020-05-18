import { FormTypes } from './FormTypes'
import { i18n } from '../../api/i18n/I18n'

const toOption = type => ({ value: type.name, label: () => i18n.get(`formTypes.${type.name}`) })
const formTypeOptions = Object.values(FormTypes).map(toOption)

export const getFormTypeOptions = () => formTypeOptions
