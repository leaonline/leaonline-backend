import { JSONReviver } from '../../api/config/JSONReviver'
import { isLabel } from '../../api/revivers/isLabel'
import { isOptions } from '../../api/revivers/isOptions'
import { isFirstOptions } from '../../api/revivers/isFirstOption'
import { isRegExp } from '../../api/revivers/isRegxExp'
import { isPrimitiveConstructor } from '../../api/revivers/isPrimitiveConstructor'

JSONReviver.register(isLabel)
JSONReviver.register(isOptions)
JSONReviver.register(isFirstOptions)
JSONReviver.register(isRegExp)
JSONReviver.register(isPrimitiveConstructor)
