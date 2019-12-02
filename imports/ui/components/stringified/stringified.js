import { Template } from 'meteor/templating'
import './stringified.html'

Template.stringified.helpers({
  stringify (target) {
    return target && JSON.stringify(target, null, 2)
  }
})