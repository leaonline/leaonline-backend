
/* global AutoForm */

AutoForm.addInputType('leaTaskContent', {
  template: 'afLeaTaskContent',
  valueOut () {
    const val = this.val()
    return val && JSON.parse(val)
  },
  valueIn (initialValue) {
    return initialValue
  }
})
