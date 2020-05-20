import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { TaskRenderers, RendererGroups } from '../../../api/task/TaskRenderers'
import { dataTarget } from '../../../utils/event'
import { Schema } from '../../../api/schema/Schema'
import { formIsValid } from '../../../utils/form'
import { i18n } from '../../../api/i18n/I18n'

import './taskContent.css'
import './taskContent.html'
import './autoform'

const types = Object.values(TaskRenderers).filter(el => !el.exclude)
const rendererGroups = Object.values(RendererGroups)
const typeSchemas = {}

const createTypeSchemaDef = ({ name, imagesCollection, version, uriBase, h5p }) => {
  return TaskRenderers[name].schema({
    i18n: i18n.get,
    name,
    imagesCollection,
    version,
    uriBase,
    h5p
  })
}

const currentTypeSchema = ({ name, imagesCollection, version, uriBase, h5p }) => {
  if (!typeSchemas[name]) {
    const typeSchemaDef = createTypeSchemaDef({ name, imagesCollection, version, uriBase, h5p })
    typeSchemas[name] = Schema.create(typeSchemaDef)
  }
  return typeSchemas[name]
}

TaskRenderers.factory.load()

Template.afLeaTaskContent.onCreated(function () {
  const instance = this
  instance.stateVars = new ReactiveDict()

  const { data } = instance
  const { atts } = data

  instance.stateVars.set('elements', data.value || [])
  instance.stateVars.set('invalid', atts.class && atts.class.indexOf('invalid') > -1)
  instance.stateVars.set('disabled', Object.prototype.hasOwnProperty.call(atts, 'disabled'))
  instance.stateVars.set('dataSchemaKey', atts['data-schema-key'])
})

Template.afLeaTaskContent.onRendered(function () {

  const instance = this
  const { data } = instance

  // update initial value to underlying hidden input
  if (data.value && data.value.length > 0) {
    updateElements(data.value || [], instance)
  }
})

Template.afLeaTaskContent.helpers({
  dataSchemaKey () {
    return Template.instance().data.atts['data-schema-key']
  },
  elements () {
    return Template.instance().stateVars.get('elements')
  },
  stringify (src) {
    return JSON.stringify(src)
  },
  contentGroups () {
    return rendererGroups
  },
  contentTypes (group) {
    return types.filter(entry => entry.group.name === group)
  },
  currentTypeToAdd () {
    return Template.instance().stateVars.get('currentTypeToAdd')
  },
  currentTypeSchema () {
    const instance = Template.instance()
    const name = instance.stateVars.get('currentTypeToAdd')
    const imagesCollection = instance.data.atts.filesCollection
    const version = instance.data.atts.version
    const uriBase = instance.data.atts.uriBase || Meteor.absoluteUrl()
    // const h5p = instance.data.atts.h5p
    return currentTypeSchema({ name, imagesCollection, version, uriBase })
  },
  overElement (index) {
    return Template.instance().stateVars.get('overElement') === index
  },
  currentElement () {
    return Template.instance().stateVars.get('currentElement')
  },
  firstElement (index) {
    return index < 1
  },
  lastElement (index) {
    const elements = Template.instance().stateVars.get('elements')
    return index > (elements.length - 2)
  }
})

Template.afLeaTaskContent.events({
  'click .add-content-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#taskContentModel').modal('show')
  },
  'click .select-content-type-button' (event, templateInstance) {
    event.preventDefault()
    const name = dataTarget(event, templateInstance, 'name')
    templateInstance.stateVars.set('currentTypeToAdd', name)
  },
  'click .modal-back-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.stateVars.set('currentTypeToAdd', null)
  },
  'submit #afLeaTaskAddContenTypeForm' (event, templateInstance) {
    event.preventDefault()
    const name = templateInstance.stateVars.get('currentTypeToAdd')
    const schema = currentTypeSchema({ name })
    const insertDoc = formIsValid('afLeaTaskAddContenTypeForm', schema)

    if (!insertDoc) return

    const elements = templateInstance.stateVars.get('elements')
    const currentElementIndex = templateInstance.stateVars.get('currentElementIndex')

    if (typeof currentElementIndex === 'number') {
      elements.splice(currentElementIndex, 1, insertDoc)
    } else {
      elements.push(insertDoc)
    }

    updateElements(elements, templateInstance)
    templateInstance.$('#taskContentModel').modal('hide')
  },
  'hidden.bs.modal' (event, templateInstance) {
    event.preventDefault()
    templateInstance.stateVars.set('currentTypeToAdd', null)
    templateInstance.stateVars.set('currentElement', null)
    templateInstance.stateVars.set('currentElementIndex', null)
  },
  'mouseover .element-container' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    templateInstance.stateVars.set('overElement', index)
  },
  'mouseout .element-container' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const currentIndex = templateInstance.stateVars.get('overElement')
    if (index === currentIndex) templateInstance.stateVars.set('overElement', null)
  },
  'click .edit-element' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.stateVars.get('elements')
    const currentElement = elements[index]
    templateInstance.stateVars.set('currentTypeToAdd', currentElement.subtype)
    templateInstance.stateVars.set('currentElement', currentElement)
    templateInstance.stateVars.set('currentElementIndex', index)
    templateInstance.$('#taskContentModel').modal('show')
  },
  'click .remove-element' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.stateVars.get('elements')
    elements.splice(index, 1)
    updateElements(elements, templateInstance)
  },
  'click .up-element' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.stateVars.get('elements')
    move(elements, index, index - 1)
    updateElements(elements, templateInstance)
  },
  'click .down-element' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.stateVars.get('elements')
    move(elements, index, index + 1)
    updateElements(elements, templateInstance)
  }
})

function move (arr, oldIndex, newIndex) {
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
  return arr
}

function updateElements (elements, templateInstance) {
  templateInstance.stateVars.set('elements', elements)
  const val = JSON.stringify(elements)
  templateInstance.$('.afLeaTaskContentHiddenInput').val(val)

}
