import { ServiceRegistry } from './ServiceRegistry'

const notFoundTemplate = async function () {
  return import('../../ui/pages/notfound/notFound')
}

const listTemplate = async function () {
  return import('../../ui/generic/list/list')
}

const galleryTemplate = async function () {
  return import('../../ui/generic/gallery/genericGallery')
}

const documentTemplate = async function () {
  return import('../../ui/generic/document/document')
}

const typeViewTemplate = async function () {
  return import('../../ui/generic/typeView/typeView')
}

export const getTemplate = type => {
  switch (type) {
    case ServiceRegistry.types.list:
      return {
        templateName: 'genericList',
        loadFunction: listTemplate
      }
    case ServiceRegistry.types.gallery:
      return {
        templateName: 'genericGallery',
        loadFunction: galleryTemplate
      }
    case ServiceRegistry.types.document:
      return {
        templateName: 'genericDocument',
        loadFunction: documentTemplate
      }
    case ServiceRegistry.types.typeView:
      return {
        templateName: 'typeView',
        loadFunction: typeViewTemplate
      }
    default:
      return {
        templateName: 'notFound',
        loadFunction: notFoundTemplate
      }
  }
}
