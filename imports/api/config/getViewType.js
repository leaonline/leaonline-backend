import { Apps } from '../apps/client/Apps'
import { ViewTypes } from './ViewTypes'

export const getViewType = (name, context) => {
  const settingsDoc = Apps.collection().findOne({ name, context })
  if (settingsDoc && settingsDoc.viewType && ViewTypes[settingsDoc.viewType]) {
    return ViewTypes[settingsDoc.viewType]
  }

  // we default for files collection a gallery template
  // to view media assets in gallery view, this can however
  // be useless for non-visual file types.
  if (context.isFilesCollection) {
    return ViewTypes.gallery
  }


  // some config contexts are  represented by a single document,
  // which often holds app-wide configuration. We rather like to
  // represent this doc by a single-document template.
  if (context.isConfigDoc) {
    return ViewTypes.document
  }

  // Type definitions are not dynamic and have no collection, so there is
  // rarely use for lists and forms, so we use a static representation
  if (context.isType) {
    return ViewTypes.typeView
  }

  // if non match we simply display all docs in a simple list
  return ViewTypes.list
}
