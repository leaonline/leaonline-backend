import { Apps } from '../../api/apps/client/Apps'
import { getViewType } from '../../api/config/getViewType'

export const parseSettings = ({ instance, config, appName }) => {
  let settingsDoc = Apps.collection().findOne({ name: appName, context: config.name })
  if (!settingsDoc) {
    const viewType = getViewType(appName, config)
    settingsDoc = { name: appName, context: config.name }
    settingsDoc.viewType = viewType.name
    settingsDoc.useHistory = true
    settingsDoc.useComments = true
    settingsDoc.useDependencyTracking = true
    settingsDoc.fields = []
  }
  instance.state.set({ settingsDoc })
}