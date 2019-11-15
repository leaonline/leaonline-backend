
/* global AutoForm */

AutoForm.addInputType('h5p', {
  template: 'afH5P',
  valueOut () {
    return this.val()
  },
  valueIn (initialValue) {
    return initialValue
  }
})
