import { Apps } from '../../api/apps/client/Apps'
import { getViewType } from '../../api/config/getViewType'

export const parseSettings = ({ instance, config, appName }) => {
  let settingsDoc = Apps.collection().findOne({ name: appName, context: config.name })
  if (!settingsDoc) {
    const viewType = getViewType(appName, config)
    settingsDoc = { name: appName, context: config.name }
    settingsDoc.viewType = viewType.name
    settingsDoc.fields = Object.keys(config.schema).map(key => ({ name: key }))
  }
  instance.state.set({ settingsDoc })
}