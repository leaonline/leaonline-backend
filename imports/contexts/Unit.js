export const Unit = {}

Unit.name = 'unit'
Unit.label = 'unit.title'
Unit.icon = 'cube'

const baseSchema = {
  unitSet: {
    type: String
  },
  shortCode: {
    type: String
  },
  legacyId: {
    name: 'legacyId',
    type: String,
    label: 'unit.legacyId'
  },
  title: {
    type: String,
    label: 'common.title'
  },
  story: {
    type: Array,
    label: 'unit.story',
    optional: true
  },
  'story.$': {
    type: Object
  },
  stimuli: {
    type: Array,
    label: 'unit.stimuli',
    optional: true
  },
  'stimuli.$': {
    type: Object,
  },
  instructions: {
    type: Array,
    optional: true,
    label: 'unit.instructions'
  },
  'instructions.$': {
    type: Object,
  },
  pages: {
    type: Array,
    optional: true,
    label: 'unit.pages'
  },
  'pages.$': {
    type: Array,
    label: 'units.page'
  },
  'pages.$.$': {
    type: Object
  }
}

const pageSchema = (fieldBase) => ({
  [`${fieldBase}.type`]: String,
  [`${fieldBase}.subtype`]: String,
  [`${fieldBase}.value`]: String,
  [`${fieldBase}.width`]: String
})

const storyPageSchema = pageSchema('story.$')
const stimuliPageSchema = pageSchema('stimuli.$')
const instructionsPageSchema = pageSchema('instructions.$')
const pagesPageSchema = pageSchema('pages.$.$')

Unit.schema = ({ autoform }) => {
  const schema = Object.assign({}, baseSchema, storyPageSchema, stimuliPageSchema, instructionsPageSchema, pagesPageSchema)
  if (autoform) {
    schema.story.autoform = autoform
    schema.stimuli.autoform = autoform
    schema.instructions.autoform = autoform
    schema['pages.$'].autoform = autoform
  }
  return schema
}
