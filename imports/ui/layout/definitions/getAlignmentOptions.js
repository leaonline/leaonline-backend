import { Alignment } from './Alignment'

const alignmentOptions = Object.values(Alignment).map(entry => ({ value: entry.name, label: entry.label }))

export const getAlignmentOptions = () => alignmentOptions