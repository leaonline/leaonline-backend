import { Template } from 'meteor/templating'
import { AutoForm } from 'meteor/aldeed:autoform'
import { EJSON } from 'meteor/ejson'
import { ReactiveDict } from 'meteor/reactive-dict'
import { TaskRenderers, RendererGroups } from '../../../api/task/TaskRenderers'
import { Scoring } from '../../../api/task/Scoring'
import { formIsValid } from '../../../utils/form'
import { dataTarget } from '../../../utils/event'
import { i18n } from '../../../api/i18n/i18n'
import { reactiveAsyncLoader } from '../../../utils/reactiveAsyncLoader'
import { MarkdownRenderer } from '../../renderers/MarkdownRenderer'
import { TaskContentUtils as Utils } from './utils'
import { CurrentTypeSchema } from './CurrentTypeSchema'
import 'meteor/aldeed:autoform-select2/static'
import 'select2'
import 'select2/select2.css'
import 'select2/select2-bootstrap.css'
import '../imageSelect/imageSelect'
import './taskContent.css'
import './taskContent.html'
import './autoform'
import { createLog } from '../../../utils/log'

const debug = createLog('ui:forms:taskContent', 'debug')
const from = Template.afSelect2
from.helpers({
  atts: function addFormControlAtts () {
    const { select2Options, ...rest } = this.atts
    // Add bootstrap class
    return AutoForm.Utility.addClass(rest, 'form-control')
  }
})

AutoForm.addInputType('leaTaskContent', {
  template: 'afLeaTaskContent',
  valueOut() {
    const val = this.val() ?? this.value
    return val && EJSON.parse(val)
  },
  valueIn(initialValue) {
    return initialValue
  },
})

Scoring.init()
const renderersLoaded = reactiveAsyncLoader(
  TaskRenderers.init({
    markdown: {
      renderer: MarkdownRenderer.render,
    },
  }),
)

const rendererGroups = Object.values(RendererGroups).filter(
  (group) => group.isTaskContent,
)

const getFormId = (isNewContent) =>
  isNewContent
    ? 'afLeaTaskAddContenTypeFormInsert'
    : 'afLeaTaskAddContenTypeFormUpdate'

Template.afLeaTaskContent.onCreated(function () {
  this.stateVars = new ReactiveDict()
  const { data } = this
  const { atts, value } = data
  const elements = Utils.getElements(value)
  this.stateVars.set({
    elements,
    invalid: atts.class && atts.class.indexOf('invalid') > -1,
    disabled: Object.prototype.hasOwnProperty.call(atts, 'disabled'),
    dataSchemaKey: atts['data-schema-key'],
  })
})

Template.afLeaTaskContent.onRendered(function () {
  const elements = Utils.getElements(this.data.value)

  // update initial value to underlying hidden input
  if (elements.length > 0) {
    Utils.updateElements(elements, this)
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
    return CurrentTypeSchema.has()
  },
  currentTypeSchema() {
    return CurrentTypeSchema.get()
  },
  overElement(index) {
    // biome-ignore  lint/suspicious/noDoubleEquals: index compare
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
    return Utils.getContent(element)
  },
  isItemContent() {
    if (!renderersLoaded.get()) return
    const instance = Template.instance()
    const previewContent = instance.stateVars.get('previewContent')
    return previewContent && previewContent.type === 'item'
  },
  previewContent() {
    if (!renderersLoaded.get()) return

    const instance = Template.instance()
    const previewContent = instance.stateVars.get('previewContent')
    if (!previewContent) return

    const previewData = instance.stateVars.get('previewData')
    const onInput = Utils.createOnItemInput(Template.instance())
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
    CurrentTypeSchema.create(name, templateInstance)
  },
  'click .modal-back-button'(event, templateInstance) {
    event.preventDefault()
    resetModalState(templateInstance)
  },
  'submit #afLeaTaskAddContenTypeFormInsert'(event, templateInstance) {
    event.preventDefault()
    Utils.submitForms(getFormId(true), templateInstance)
  },
  'submit #afLeaTaskAddContenTypeFormUpdate'(event, templateInstance) {
    event.preventDefault()
    Utils.submitForms(getFormId(false), templateInstance)
  },
  'click .preview-content-button'(event, templateInstance) {
    event.preventDefault()
    const isNewContent = templateInstance.stateVars.get('isNewContent')
    const type = templateInstance.stateVars.get('currentTypeToAdd')
    const formId = getFormId(isNewContent)
    const insertDoc = formIsValid(formId, CurrentTypeSchema.get())
    if (!insertDoc) return

    delete insertDoc.unitSet

    const isItemContent = Utils.isItem(type)

    templateInstance.stateVars.set({
      previewContent: null,
      updatePreview: true,
    })

    // we use a timeout here to allow some update
    // indicator when clicking on the button
    setTimeout(() => {
      const previewContent = isItemContent
        ? Utils.contentFromItem(type, insertDoc)
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
        const previewData = Utils.createItemData({ unitId, subtype: type, page: 0 })
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
    const elementIsItem = Utils.isItem(name)
    const currentElement = elementIsItem ? elementDoc.value : elementDoc

    if (elementIsItem) {
      const unitId = templateInstance.data.unitId || 'undefined'
      const previewData = Utils.createItemData({ unitId, subtype: name, page: index })
      templateInstance.stateVars.set({ previewData })
    }

    CurrentTypeSchema.create(name, templateInstance)
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
    Utils.updateElements(elements, templateInstance)
  },
  'click .up-element'(event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.stateVars.get('elements')
    move(elements, index, index - 1)
    Utils.updateElements(elements, templateInstance)
  },
  'click .down-element'(event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.stateVars.get('elements')
    move(elements, index, index + 1)
    Utils.updateElements(elements, templateInstance)
  },
  'click .generate-responses'(event, templateInstance) {
    event.preventDefault()
  },
})

function move(arr, oldIndex, newIndex) {
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
  return arr
}

function resetModalState(templateInstance) {
  CurrentTypeSchema.reset()
  templateInstance.stateVars.set({
    isNewContent: false,
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
