/* global AutoForm */
import { AutoFormThemeBootstrap5 } from 'meteor/communitypackages:autoform-bootstrap5/dynamic'
import 'meteor/aldeed:autoform/dynamic'

async function init() {
  await AutoForm.load()
  await AutoFormThemeBootstrap5.load()
  // theme is imported, you can now make the form available
  // you could use a reactive var that resolves to true here
  // or any other mechanism you like to use to reactively activate the form
  AutoForm.setDefaultTemplate('bootstrap5')
}
;(function () {
  init()
    .catch((e) => console.error('[autoForm]: init failed - ', e))
    .then(() => console.info('[autoForm]: initialized'))
})()
