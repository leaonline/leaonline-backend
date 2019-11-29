import { Meteor } from 'meteor/meteor'
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

const { renderUrl } = Meteor.settings.public.hosts.items
TaskRenderers.h5p.configure({ renderUrl })

const types = Object.values(TaskRenderers).filter(el => !el.exclude)
const rendererGroups = Object.values(RendererGroups)
const typeSchemas = {}

const currentTypeSchema = ({ name, imagesCollection, version, uriBase, h5p }) => {
  if (!typeSchemas[name]) {
    typeSchemas[name] = Schema.create(TaskRenderers[name].schema({
      i18n: i18n.get,
      name,
      imagesCollection,
      version,
      uriBase,
      h5p
    }))
  }
  return typeSchemas[name]
}

TaskRenderers.factory.load()

Template.afLeaTaskContent.onCreated(function () {
  const instance = this
  instance.state = new ReactiveDict()

  const { data } = instance
  const { atts } = data

  instance.state.set('elements', data.value || [])
  instance.state.set('invalid', atts.class && atts.class.indexOf('invalid') > -1)
  instance.state.set('disabled', Object.prototype.hasOwnProperty.call(atts, 'disabled'))
  instance.state.set('dataSchemaKey', atts['data-schema-key'])
})

Template.afLeaTaskContent.helpers({
  dataSchemaKey () {
    return Template.instance().data.atts['data-schema-key']
  },
  elements () {
    return Template.instance().state.get('elements')
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
    return Template.instance().state.get('currentTypeToAdd')
  },
  currentTypeSchema () {
    const instance = Template.instance()
    const name = instance.state.get('currentTypeToAdd')
    const imagesCollection = instance.data.atts.imagesCollection
    const version = instance.data.atts.imagesVersion
    const uriBase = instance.data.atts.imagesUriBase
    const h5p = instance.data.atts.h5p
    return currentTypeSchema({ name, imagesCollection, version, uriBase, h5p })
  },
  overElement (index) {
    return Template.instance().state.get('overElement') === index
  },
  currentElement () {
    return Template.instance().state.get('currentElement')
  },
  firstElement (index) {
    return index < 1
  },
  lastElement (index) {
    const elements = Template.instance().state.get('elements')
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
    templateInstance.state.set('currentTypeToAdd', name)
  },
  'click .modal-back-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('currentTypeToAdd', null)
  },
  'submit #afLeaTaskAddContenTypeForm' (event, templateInstance) {
    event.preventDefault()
    const name = templateInstance.state.get('currentTypeToAdd')
    const schema = currentTypeSchema({ name })
    const insertDoc = formIsValid('afLeaTaskAddContenTypeForm', schema)

    if (!insertDoc) return

    const elements = templateInstance.state.get('elements')
    const currentElementIndex = templateInstance.state.get('currentElementIndex')

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
    templateInstance.state.set('currentTypeToAdd', null)
    templateInstance.state.set('currentElement', null)
    templateInstance.state.set('currentElementIndex', null)
  },
  'mouseover .element-container' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    templateInstance.state.set('overElement', index)
  },
  'mouseout .element-container' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const currentIndex = templateInstance.state.get('overElement')
    if (index === currentIndex) templateInstance.state.set('overElement', null)
  },
  'click .edit-element' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.state.get('elements')
    const currentElement = elements[index]
    templateInstance.state.set('currentTypeToAdd', currentElement.subtype)
    templateInstance.state.set('currentElement', currentElement)
    templateInstance.state.set('currentElementIndex', index)
    templateInstance.$('#taskContentModel').modal('show')
  },
  'click .remove-element' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.state.get('elements')
    elements.splice(index, 1)
    updateElements(elements, templateInstance)
  },
  'click .up-element' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.state.get('elements')
    move(elements, index, index - 1)
    updateElements(elements, templateInstance)
  },
  'click .down-element' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance, 'index')
    const elements = templateInstance.state.get('elements')
    move(elements, index, index + 1)
    updateElements(elements, templateInstance)
  }
})

function move (arr, oldIndex, newIndex) {
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
  return arr
}

function updateElements (elements, templateInstance) {
  templateInstance.state.set('elements', elements)
  const val = JSON.stringify(elements)
  templateInstance.$('.afLeaTaskContentHiddenInput').val(val)

}