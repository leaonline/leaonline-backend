export const ViewTypes = {
  list: {
    name: 'list',
    template: 'genericList',
    label: 'viewTypes.list',
    load: async function () {
      return import('../../ui/views/list/list')
    }
  },
  gallery: {
    name: 'gallery',
    template: 'genericGallery',
    label: 'viewTypes.gallery',
    load: async function () {
      return import('../../ui/views/gallery/gallery')
    }
  },
  document: {
    name: 'document',
    template: 'genericDocument',
    label: 'viewTypes.document',
    load: async function () {
      return import('../../ui/views/document/document')
    }
  },
  typeView: {
    name: 'typeView',
    template: 'typeView',
    label: 'viewTypes.typeView',
    load: async function () {
      return import('../../ui/views/typeView/typeView')
    }
  }
}
