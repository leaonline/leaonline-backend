/* global AutoForm */
import { FormTypes } from '../FormTypes'

AutoForm.addInputType(FormTypes.item.template, {
  template: 'afLeaItemForm',
  valueOut () {
    return this.val()
  },
  valueIn (initialValue) {
    return initialValue
  }
})