/**
 * Use an interface in toFormSchema and automatically assign
 * autoform form based on flags instead of manual configuration (convention
 * over configuration)
 */

export const FormTypes = {
  imageSelect: {
    name: 'imageSelect',
    template: 'leaImageSelect',
    loaded: false,
    schema: {
      imagesCollection: String,
      save: {
        type: String,
        allowedValues: ['id', 'url'],
      },
    },
    load: async () => {
      const mod = await import('./imageSelect/imageSelect')
      FormTypes.imageSelect.loaded = true
      return mod
    },
  },
  sortable: {
    name: 'sortable',
    template: 'leaSortable',
    loaded: false,
    schema: {},
    load: async () => {
      const mod = await import('./sortable/sortable')
      FormTypes.sortable.loaded = true
      return mod
    },
  },
  taskContent: {
    name: 'taskContent',
    template: 'leaTaskContent',
    loaded: false,
    schema: {
      filesCollection: {
        type: String,
      },
      version: {
        type: String,
        allowedValues: ['original', 'thumbnail'],
      },
      uriBase: {
        type: String,
      },
    },
    load: async () => {
      const mod = await import('./taskContent/taskContent')
      FormTypes.taskContent.loaded = true
      return mod
    },
  },
  regExp: {
    name: 'regExp',
    template: 'regexp',
    loaded: false,
    load: async () => {
      const mod = await import('meteor/leaonline:autoform-regexp')
      FormTypes.regExp.loaded = true
      return mod
    },
  },
}
