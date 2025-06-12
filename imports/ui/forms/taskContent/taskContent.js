import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { AutoForm } from 'meteor/aldeed:autoform'
import { EJSON } from 'meteor/ejson'
import { Random } from 'meteor/random'
import { ReactiveDict } from 'meteor/reactive-dict'
import { TaskRenderers, RendererGroups } from '../../../api/task/TaskRenderers'
import { Scoring } from '../../../api/task/Scoring'
import { Apps } from '../../../api/apps/Apps'
import { ContextRegistry } from '../../../api/config/ContextRegistry'
import { Schema } from '../../../api/schema/Schema'
import { FormTypes } from '../FormTypes'
import { formIsValid } from '../../../utils/form'
import { dataTarget } from '../../../utils/event'
import { getCollection } from '../../../utils/collection'
import { i18n } from '../../../api/i18n/i18n'
import { toFormSchema } from '../../config/toFormSchema'
import { parseCollections } from '../../config/collection/parseCollections'
import { loadDocumentsWithDependencies } from '../../config/loadDocumentsWithDependencies'
import { reactiveAsyncLoader } from '../../../utils/reactiveAsyncLoader'
import { MarkdownRenderer } from '../../renderers/MarkdownRenderer'
import 'select2'
import 'select2/select2.css'
import 'select2/select2-bootstrap.css'
import '../imageSelect/imageSelect'
import './taskContent.css'
import './taskContent.html'
import './autoform'

Scoring.init()
const renderersLoaded = reactiveAsyncLoader(
  TaskRenderers.init({
    markdown: {
      renderer: MarkdownRenderer.render,
    },
  }),
)

AutoForm.addInputType('leaTaskContent', {
  template: 'afLeaTaskContent',
  valueOut() {
    const dsk = this.attr('data-schema-key')
    const val = this.val() ?? this.value
    const content = val && EJSON.parse(val)
    return dsk.startsWith('page') ? { content } : content
  },
  valueIn(initialValue) {
    return initialValue
  },
})

const typeSchemas = {}
const rendererGroups = Object.values(RendererGroups).filter(
  (group) => group.isTaskContent,
)

const getContent = (element) => {
  if (element.type !== 'item') {
    return element
  }

  const context = ContextRegistry.get(element.subtype)
  if (!context) {
    throw new Error(`Missing context for subtype ${element.subtype}`)
  }
  const collection = getCollection(context.name)
  element.value = collection.findOne(element.value)

  return element
}

const createTypeSchemaDef = ({ name, imageForm }) => {
  const renderer = TaskRenderers.get(name)
  if (!renderer) throw new Error(`Expected renderer for name ${name}`)
  return renderer.schema({ i18n: i18n.get, name, imageForm })
}

const isItem = (name) => {
  const context = ContextRegistry.get(name)
  return context?.isItem
}

const getFormId = (isNewContent) =>
  isNewContent
    ? 'afLeaTaskAddContenTypeFormInsert'
    : 'afLeaTaskAddContenTypeFormUpdate'

const contentFromItem = (name, value) => ({
  type: 'item',
  subtype: name,
  value,
  width: '12',
})

const getImageForm = ({
  imagesCollection,
  save = 'url',
  uriBase,
  version,
}) => ({
  type: FormTypes.imageSelect.template,
  imagesCollection,
  save,
  uriBase,
  version,
})

const loadDependencies = (config, appName) => {
  const dependencies = config.dependencies || []
  const app = Apps.get(appName)
  const { connection } = app

  dependencies
    .map((name) => ContextRegistry.get(name))
    .forEach((dependency) => {
      const instance = {}
      parseCollections({
        config: dependency,
        connection,
        instance,
      })

      loadDocumentsWithDependencies({
        config: dependency,
        connection,
        instance: null,
        logDebug: (...args) => console.log(...args),
        onSubscribed: () => console.log('subscribed', config.name),
      })
    })
}

const getItemSchema = ({ name, app, settingsDoc }) => {
  const config = ContextRegistry.get(name)
  loadDependencies(config, app)
  const schema = config.schema
  return toFormSchema({ schema, config, settingsDoc, app })
}

const createItemData = ({ unitId, page, subtype, onInput }) => {
  const data = {}
  data.userId = Meteor.userId()
  data.sessionId = 'testSession'
  data.unitId = unitId
  data.page = page
  data.subtype = subtype
  data.onInput = onInput
  return data
}

const currentTypeSchema = ({
  name,
  imagesCollection,
  version,
  uriBase,
  app,
  settingsDoc,
}) => {
  const imageForm = getImageForm({ imagesCollection, version, uriBase })
  if (!typeSchemas[name]) {
    const isItemContent = isItem(name)
    const typeSchemaDef = isItemContent
      ? getItemSchema({ name, app, settingsDoc })
      : createTypeSchemaDef({ name, imageForm })
    typeSchemas[name] = Schema.create(typeSchemaDef)
  }
  return typeSchemas[name]
}

let _currentTypeSchema

const createTypeSchema = (name, templateInstance) => {
  const imagesCollection = templateInstance.data.atts.filesCollection
  const version = templateInstance.data.atts.version
  const { connection } = templateInstance.data.atts
  const { app } = templateInstance.data.atts
  const { settingsDoc } = templateInstance.data.atts
  const uriBase = connection._stream.rawUrl

  _currentTypeSchema = currentTypeSchema({
    name,
    imagesCollection,
    version,
    uriBase,
    app,
    settingsDoc,
  })
  setTimeout(() => templateInstance.stateVars.set('hasSchema', true), 300)
}

Template.afLeaTaskContent.onCreated(function () {
  const instance = this
  instance.stateVars = new ReactiveDict()

  const { data } = instance
  const { atts, value } = data
  const elements = getElements(value)
  instance.stateVars.set({
    elements,
    invalid: atts.class && atts.class.indexOf('invalid') > -1,
    disabled: Object.prototype.hasOwnProperty.call(atts, 'disabled'),
    dataSchemaKey: atts['data-schema-key'],
  })
})

const getElements = (value) => {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'object' && value.content) {
    return value.content
  }
  return value ?? []
}

Template.afLeaTaskContent.onRendered(function () {
  const instance = this
  const elements = getElements(instance.data.value)

  // update initial value to underlying hidden input
  if (elements.length > 0) {
    updateElements(elements, instance)
  }
})

Template.afLeaTaskContent.helpers({
  loadComplete() {
    return renderersLoaded.get()
  },
  dataSchemaKey() {
    return Template.instance().data.atts['data-schema-key']
  },
  elements() {
    return Template.instance().stateVars.get('elements')
  },
  stringify(src) {
    return EJSON.stringify(src)
  },
  contentGroups() {
    return rendererGroups
  },
  contentTypes(group) {
    return TaskRenderers.getGroup(group)
  },
  currentTypeToAdd() {
    if (!renderersLoaded.get()) return
    const name = Template.instance().stateVars.get('currentTypeToAdd')
    return TaskRenderers.get(name)
  },
  hasSchema() {
    return Template.instance().stateVars.get('hasSchema')
  },
  currentTypeSchema() {
    return _currentTypeSchema
  },
  overElement(index) {
    return Template.instance().stateVars.get('overElement') == index
  },
  currentElement() {
    return (
      !Template.instance().stateVars.get('isNewContent') &&
      Template.instance().stateVars.get('currentElement')
    )
  },
  firstElement(index) {
    return index < 1
  },
  lastElement(index) {
    const elements = Template.instance().stateVars.get('elements') ?? []
    return index > elements.length - 2
  },
  getContent(element) {
    return getContent(element)
  },
  isItemContent() {
    const instance = Template.instance()
    if (!renderersLoaded.get()) return
    const previewContent = instance.stateVars.get('previewContent')
    return previewContent && previewContent.type === 'item'
  },
  previewContent() {
    if (!renderersLoaded.get()) return

    const instance = Template.instance()
    const previewContent = instance.stateVars.get('previewContent')
    if (!previewContent) return

    const previewData = instance.stateVars.get('previewData')
    const onInput = onItemInput.bind(Template.instance())
    return Object.assign({}, previewContent, previewData, { onInput })
  },
  scoreContent() {
    return Template.instance().stateVars.get('scoreContent')
  },
  updatePreview() {
    return Template.instance().stateVars.get('updatePreview')
  },
  isUpdateContentForm() {
    return Template.instance().data.value
  },
  // modal
  modalIsNewContent() {
    return Template.instance().stateVars.get('isNewContent')
  },
  // score
  allScoresTrue() {
    return Template.instance().stateVars.get('allScoresTrue')
  },
})

Template.afLeaTaskContent.events({
  'click .add-content-button'(event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#taskContentModel').modal('show')
  },
  'click .select-content-type-button': (event, templateInstance) => {
    event.preventDefault()
    resetModalState(templateInstance)
    const name = dataTarget(event, templateInstance, 'name')
    templateInstance.stateVars.set('currentTypeToAdd', name)
    templateInstance.stateVars.set('isNewContent', true)
    createTypeSchema(name, templateInstance)
  },
  'click .modal-back-button'(event, templateInstance) {
    event.preventDefault()
    resetModalState(templateInstance)
  },
  'submit #afLeaTaskAddContenTypeFormInsert'(event, templateInstance) {
    event.preventDefault()
    submitForms(getFormId(true), templateInstance)
  },
  'submit #afLeaTaskAddContenTypeFormUpdate'(event, templateInstance) {
    event.preventDefault()
    submitForms(getFormId(false), templateInstance)
  },
  'click .preview-content-button'(event, templateInstance) {
    event.preventDefault()
    const isNewContent = templateInstance.stateVars.get('isNewContent')
    const type = templateInstance.stateVars.get('currentTypeToAdd')
    const formId = getFormId(isNewContent)
    const insertDoc = formIsValid(formId, _currentTypeSchema)
    if (!insertDoc) return

    delete insertDoc.unitSet

    const isItemContent = isItem(type)

    templateInstance.stateVars.set({
      previewContent: null,
      updatePreview: true,
    })

    // we use a timeout here to allow some update
    // indicator when clicking on the button
    setTimeout(() => {
      const previewContent = isItemContent
        ? contentFromItem(type, insertDoc)
        : insertDoc

      // if we have an item we want to initialize the scoring in order to allow
      // a full preview including a scoring engine to test against
      const scoreContent = isItemContent && {
        type: 'preview',
        subtype: Scoring.name,
        scores: Scoring.run(type, previewContent.value, []),
      }

      if (isItemContent && isNewContent) {
        const unitId = templateInstance.data.unitId || 'undefined'
        const previewData = createItemData({ unitId, subtype: type, page: 0 })
        templateInstance.stateVars.set({ previewData })
      }

      templateInstance.stateVars.set({
        previewContent,
        scoreContent,
        updatePreview: false,
      })
    }, 300)
  },
  'hidden.bs.modal'(event, templateInstance) {
    event.preventDefault()
    resetModalState(templateInstance)
  },
  'mouseenter .element-container'(event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    templateInstance.stateVars.set('overElement', index)
  },
  'mouseleave .element-container'(event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const currentIndex = templateInstance.stateVars.get('overElement')
    if (index === currentIndex)
      templateInstance.stateVars.set('overElement', null)
  },
  'click .edit-element'(event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.stateVars.get('elements')
    const elementDoc = elements[index]
    const name = elementDoc.subtype
    const elementIsItem = isItem(name)
    const currentElement = elementIsItem ? elementDoc.value : elementDoc

    if (elementIsItem) {
      const unitId = templateInstance.data.unitId || 'undefined'
      const previewData = createItemData({ unitId, subtype: name, page: index })
      templateInstance.stateVars.set({ previewData })
    }

    createTypeSchema(name, templateInstance)
    templateInstance.stateVars.set('currentTypeToAdd', name)
    templateInstance.stateVars.set('isNewContent', false)
    templateInstance.stateVars.set('currentElement', currentElement)
    templateInstance.stateVars.set('previewContent', elementDoc)
    templateInstance.stateVars.set('currentElementIndex', index)
    templateInstance.$('#taskContentModel').modal('show')
  },
  'click .remove-element'(event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.stateVars.get('elements')
    const element = elements[index]
    const { label } = TaskRenderers.get(element.subtype)
    const title = i18n.get(label)
    if (!window.confirm(i18n.get('actions.confirmRemove', { title }))) return
    elements.splice(index, 1)
    updateElements(elements, templateInstance)
  },
  'click .up-element'(event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.stateVars.get('elements')
    move(elements, index, index - 1)
    updateElements(elements, templateInstance)
  },
  'click .down-element'(event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.stateVars.get('elements')
    move(elements, index, index + 1)
    updateElements(elements, templateInstance)
  },
  'click .generate-responses'(event, templateInstance) {
    event.preventDefault()
  },
})

function submitForms(formId, templateInstance) {
  const name = templateInstance.stateVars.get('currentTypeToAdd')
  const insertDoc = formIsValid(formId, _currentTypeSchema)
  if (!insertDoc) return

  const elements = templateInstance.stateVars.get('elements') || []
  const currentElementIndex = templateInstance.stateVars.get(
    'currentElementIndex',
  )

  const contentElementDoc = isItem(name)
    ? contentFromItem(name, insertDoc)
    : insertDoc

  if (typeof currentElementIndex === 'number') {
    const currentElementDoc = elements[currentElementIndex]
    if (currentElementDoc.contentId) {
      contentElementDoc.contentId = currentElementDoc.contentId
    } else {
      contentElementDoc.contentId = Random.id()
    }
    elements.splice(currentElementIndex, 1, contentElementDoc)
  } else {
    contentElementDoc.contentId = Random.id()
    elements.push(contentElementDoc)
  }

  updateElements(elements, templateInstance)
  templateInstance.$('#taskContentModel').modal('hide')
}

function move(arr, oldIndex, newIndex) {
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
  return arr
}

function updateElements(elements, templateInstance) {
  const val = EJSON.stringify(elements)
  const dsk = templateInstance.data.atts['data-schema-key']
  templateInstance.$(`[data-schema-key="${dsk}"]`).val(val)
  templateInstance.stateVars.set('elements', elements)
}

/**
 * Handler for scoring item inputs
 * @param userId
 * @param sessionId
 * @param taskId
 * @param page
 * @param type
 * @param responses
 */
function onItemInput({
  userId,
  sessionId,
  taskId,
  page,
  type,
  subtype,
  responses,
}) {
  const instance = this
  const previewContent = instance.stateVars.get('previewContent')
  if (!previewContent) {
    console.warn('[TaskContent]: no content to submit onItemInput')
    return
  }

  const itemDoc = previewContent.value // item docs are stored in value
  const responseDoc = { responses }
  const scoreResults = Scoring.run(subtype, itemDoc, responseDoc)
  const scoreContent = {
    type: 'preview',
    subtype: Scoring.name,
    scores: scoreResults,
  }

  const allScoresTrue = scoreResults.every((entry) => entry.score)

  instance.stateVars.set({ scoreContent, responses, allScoresTrue })
}

function resetModalState(templateInstance) {
  _currentTypeSchema = null
  templateInstance.stateVars.set({
    isNewContent: false,
    hasSchema: false,
    currentTypeToAdd: null,
    previewContent: null,
    previewData: null,
    currentElement: null,
    currentElementIndex: null,
    scoreContent: null,
    responses: null,
    allScoresTrue: null,
  })
}
