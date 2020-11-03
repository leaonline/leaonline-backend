import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import Sortable from 'sortablejs'
// TODO remove the lea related imports and make this extension generic
// TODO in order to publish it to atmosphere
import { getCollection } from '../../../utils/collection'
import { ContextRegistry } from '../../../api/config/ContextRegistry'
import './autoform'
import './sortable.css'
import './sortable.html'

Template.afSortable.onCreated(function () {
  const instance = this
  instance.stateVars = new ReactiveDict()

  const { data } = instance
  const { atts } = data

  instance.context = ContextRegistry.get(atts.collection)
  instance.collection = getCollection(atts.collection)

  const invalid = atts.class && atts.class.indexOf('invalid') > -1
  const disabled = Object.prototype.hasOwnProperty.call(atts, 'disabled')
  const dataSchemaKey = atts['data-schema-key']
  const options = data.value
    ? getOptions(data.value, instance.context, instance.collection)
    : data.selectOptions

  const unselectedOptions = getUnselectedOptions(options, data.selectOptions)

  instance.state.set({ options, invalid, disabled, dataSchemaKey, unselectedOptions })
})

Template.afSortable.helpers({
  options () {
    return Template.instance().state.get('options')
  },
  unselectedOptions () {
    return Template.instance().state.get('unselectedOptions')
  },
  dataSchemaKey () {
    return Template.instance().state.get('dataSchemaKey')
  },
  invalid () {
    return Template.instance().state.get('invalid')
  }
})

Template.afSortable.onRendered(function () {
  const instance = this
  const $target = instance.$('.afsortable-sort-target')
  const $unused = instance.$('.afsortable-unused-target')

  createSortable($target.get(0), {
    animation: 150,
    ghostClass: 'bg-primary',
    group: 'shared',
    onEnd: function () {
      updateData(instance)
    },
    onAdd: function (evt) {
      const $element = instance.$(evt.item)
      $element.addClass('afsortable-entry')
      $element.removeClass('afsortable-unused')
    }
  })

  createSortable($unused.get(0), {
    animation: 150,
    ghostClass: 'bg-primary',
    group: 'shared',
    onEnd: function () {
      updateData(instance)
    },
    onAdd: function (evt) {
      const $element = instance.$(evt.item)
      $element.addClass('afsortable-unused')
      $element.removeClass('afsortable-entry')
    }
  })

  updateData(instance)
})

function getOptions (value, context, collection) {
  return value.map(_id => {
    const doc = collection.findOne(_id)
    return {
      value: _id,
      label: doc[context.representative]
    }
  })
}

function getUnselectedOptions (options, allOptions) {
  if (options.length === allOptions.length) return []

  return allOptions
    .filter(doc => !options.find(search => search.value === doc.value))
}

function createSortable (target, options) {
  return new Sortable(target, options)
}

function updateData (templateInstance) {
  const values = []
  const $destination = templateInstance.$('.afSortableHiddenInput')
  const $source = templateInstance.$('.afsortable-entry')
  $source.map((index, node) => {
    const value = templateInstance.$(node).data('target')
    values.push(value)
  })
  $destination.val(JSON.stringify(values))
}
