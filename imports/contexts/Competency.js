export const Competency = {}

Competency.name = 'competency'
Competency.label = 'competency.title'
Competency.icon = 'star'

Competency.schema = () => ({
  dimension: String,
  shortCode: String,
  description: String,
  description_legacy: String,
  descriptionSimple: String,
  descriptionSimple_legacy: String
})