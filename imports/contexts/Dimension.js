export const Dimension = {}

Dimension.name = 'dimension'
Dimension.label = 'dimension.title'
Dimension.icon = 'th-large'

Dimension.schema = () => ({
  title: String,
  description: {
    type: String,
    optional: true
  },
  icon: String,
  colorType: String,
  shortCode: String,
  shortNum: Number
})
