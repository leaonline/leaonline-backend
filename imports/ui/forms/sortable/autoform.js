import { EJSON } from "meteor/ejson"

AutoForm.addInputType('leaSortable', {
  template: 'afSortable',
  valueOut () {
    const val = this.val()
    return val && EJSON.parse(val)
  },
  valueIn (initialValue) {
    return initialValue
  }
})