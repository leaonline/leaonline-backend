import { Apps } from '../../api/apps/Apps'
import { rateLimitMethods } from '../../factories/rateLimit'
import { createMethods } from '../../factories/createMethods'

const methods = Object.values(Apps.methods)
createMethods(methods)
rateLimitMethods(methods)
