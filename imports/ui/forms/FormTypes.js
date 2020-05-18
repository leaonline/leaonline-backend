export const FormTypes = {
  imageSelect: {
    name: 'imageSelect',
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
    schema: {

    },
    load: async function () {
      return import('./taskContent/taskContent')
    }
  }
}
