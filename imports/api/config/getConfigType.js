import { ServiceRegistry } from './ServiceRegistry'

export const getConfigType = (context) => {
  if (context.isFilesCollection) {
    return ServiceRegistry.types.gallery
  }
  if (context.isConfigDoc) {
    return ServiceRegistry.types.document
  }
  if (context.isType) {
    return ServiceRegistry.types.typeView
  }
  return ServiceRegistry.types.list
}
