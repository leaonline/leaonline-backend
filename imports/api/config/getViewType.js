import { ViewTypes } from './ViewTypes'

export const getViewType = (context) => {
  if (context.isFilesCollection) {
    return ViewTypes.gallery
  }
  if (context.isConfigDoc) {
    return ViewTypes.document
  }
  if (context.isType) {
    return ViewTypes.typeView
  }
  return ViewTypes.list
}
