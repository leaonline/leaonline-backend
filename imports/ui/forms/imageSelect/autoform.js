
/* global AutoForm */

AutoForm.addInputType('imageSelect', {
  template: 'afImageSelect',
  valueOut () {
    return this.val()
  },
  valueIn (initialValue) {
    return initialValue
  }
})