export const FormTypes = {
  imageSelect: {
    name: 'imageSelect',
    template: 'leaImageSelect',
    schema: {
      imagesCollection: String,
      save: {
        type: String,
        allowedValues: ['id', 'url']
      }
    },
    load: async function () {
      return import('./imageSelect/imageSelect')
    }
  },
  taskContent: {
    name: 'taskContent',
    template: 'leaTaskContent',
    schema: {
      filesCollection: {
        type: String
      },
      version: {
        type: String,
        allowedValues: ['original', 'thumbnail']
      },
      uriBase: {
        type: String
      }
    },
    load: async function () {
      return import('./taskContent/taskContent')
    }
  },
  item: {
    name: 'itemForm',
    template: 'leaItemForm',
    load: async function () {
      return import('./itemForm/itemForm')
    }
  },
  regExp: {
    name: 'regExp',
    template: 'regexp',
    load: async function () {
      return import('meteor/jkuester:autoform-regexp')
    }
  }
}
