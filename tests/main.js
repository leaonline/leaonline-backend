import { onServerExec } from '../imports/utils/arch'

onServerExec(() => {
  require('../imports/startup/server/settingsSchema.tests')
})
