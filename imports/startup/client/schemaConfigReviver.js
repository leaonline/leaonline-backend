import { JSONReviver } from '../../api/config/JSONReviver'
import { isLabel } from '../../api/revivers/isLabel'
import { isOptions } from '../../api/revivers/isOptions'
import { isFirstOptions } from '../../api/revivers/isFirstOption'
import { isPrimitiveConstructor } from '../../api/revivers/isPrimitiveConstructor'
import { isCustomConstructor } from '../../api/revivers/isCustomConstructor'

JSONReviver.register(isLabel)
JSONReviver.register(isOptions)
JSONReviver.register(isFirstOptions)
JSONReviver.register(isPrimitiveConstructor)
JSONReviver.register(isCustomConstructor)
