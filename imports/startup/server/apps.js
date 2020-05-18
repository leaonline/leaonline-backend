import { Apps } from '../../api/apps/Apps'
import { rateLimitMethods } from '../../factories/rateLimit'
import { createMethods } from '../../factories/createMethods'
import { createCollection } from '../../factories/createCollection'

// create a colleciton to store backend-settings for apps on the server
const factorySettings = { name: Apps.name, schema: Apps.schema }
const AppsCollection = createCollection(factorySettings)

// create apps methods
const methods = Object.values(Apps.methods)
createMethods(methods)
rateLimitMethods(methods)

// finally connect Collection with Apps
Apps.collection = () => AppsCollection