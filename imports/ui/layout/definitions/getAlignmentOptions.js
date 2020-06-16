import { Alignment } from './Alignment'
import { i18n } from '../../../api/i18n/i18n'

const alignmentOptions = Object.values(Alignment).map(entry => ({ value: entry.name, label: () => i18n.get(entry.label) }))

export const getAlignmentOptions = () => alignmentOptions