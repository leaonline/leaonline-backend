import { Template } from 'meteor/templating'
import { EJSON } from 'meteor/ejson'
import { ReactiveDict } from 'meteor/reactive-dict'
import Sortable from 'sortablejs'
import './autoform'
import './sortable.css'
import './sortable.html'

Template.afSortable.onCreated(function () {
  this.stateVars = new ReactiveDict()

  this.autorun(() => {
    const data = Template.currentData()
    const { atts } = data
    const invalid = atts.class && atts.class.indexOf('invalid') > -1
    const disabled = Object.prototype.hasOwnProperty.call(atts, 'disabled')
    const dataSchemaKey = atts['data-schema-key']
    const selectedOptions = getSelectedOptions(
      data.value || [],
      data.selectOptions || [],
    )
    const unselectedOptions = getUnselectedOptions(
      selectedOptions || [],
      data.selectOptions || [],
    )

    this.state.set({
      invalid,
      disabled,
      dataSchemaKey,
      selectedOptions,
      unselectedOptions,
    })
  })
})

Template.afSortable.helpers({
  selectedOptions() {
    return Template.instance().state.get('selectedOptions')
  },
  unselectedOptions() {
    return Template.instance().state.get('unselectedOptions')
  },
  dataSchemaKey() {
    return Template.instance().state.get('dataSchemaKey')
  },
  invalid() {
    return Template.instance().state.get('invalid')
  },
})

Template.afSortable.onRendered(function () {
  const $target = this.$('.afsortable-sort-target')
  const $unused = this.$('.afsortable-unused-target')

  createSortable($target.get(0), {
    animation: 150,
    ghostClass: 'bg-primary',
    group: 'shared',
    swapThreshold: 1,
    onEnd: () => {
      updateData(this)
    },
    onAdd: (evt) => {
      const $element = this.$(evt.item)
      $element.addClass('afsortable-entry')
      $element.removeClass('afsortable-unused')
    },
  })

  createSortable($unused.get(0), {
    animation: 150,
    ghostClass: 'bg-primary',
    group: 'shared',
    swapThreshold: 1,
    onEnd: () => {
      updateData(this)
    },
    onAdd: (evt) => {
      const $element = this.$(evt.item)
      $element.addClass('afsortable-unused')
      $element.removeClass('afsortable-entry')
    },
  })

  updateData(this)
})

function getSelectedOptions(value = [], allOptions = []) {
  return value.map((id) =>
    allOptions.find((opt) => {
      if (!opt) {
        console.warn('opt is undefined', id, allOptions)
        return false
      }

      return opt.value === id
    }),
  )
}

function getUnselectedOptions(options = [], allOptions = []) {
  if (options.length === allOptions.length) return []

  return (allOptions || []).filter(
    (doc) => !options.find((search) => search?.value === doc?.value),
  )
}

function createSortable(target, options) {
  return new Sortable(target, options)
}

function updateData(templateInstance) {
  const values = []
  const $destination = templateInstance.$('.afSortableHiddenInput')
  const $source = templateInstance.$('.afsortable-entry')
  const iteratable = $source.get(0) ? $source : []

  iteratable.map((index, node) => {
    const value = templateInstance.$(node).data('target')
    values.push(value)
    return undefined
  })

  $destination.val(EJSON.stringify(values))
}
