import { onClient } from '../utils/arch'

export const Field = {}

Field.name = 'field'
Field.label = 'field.title'
Field.icon = 'wrench'

Field.collection = () => {
  throw new Error('override abstract method')
}

Field.schema = () => ({
  title: String,
  shortCode: {
    type: String,
    min: 2,
    max: 2,
    custom: function () {
      const context = this
      const { value } = context
      if (!context.isSet || !value || value.length !== 2 || value !== value.toUpperCase() || Field.collection().findOne({ shortCode: value })) {
        return 'invalid'
      }
    },
    autoform: onClient({
      class: 'text-upppercase',
      options: () => Field.collection().find().map(doc => ({ value: doc._id, label: doc.title }))
    })
  },
  jobs: Array,
  'jobs.$': String
})
