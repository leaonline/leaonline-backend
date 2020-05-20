/* global AutoForm */

AutoForm.addInputType('leaImageSelect', {
  template: 'afImageSelect',
  valueOut () {
    return this.val()
  },
  valueIn (initialValue) {
    return initialValue
  }
})
