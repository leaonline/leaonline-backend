import { Template } from 'meteor/templating'
import { Apps } from '../../../api/apps/Apps'
import { Components } from '../../../api/core/Components'
import './overview.html'

Components.debug = true
const componentsLoaded = Components.load([
  Components.template.icon
])

Template.statusOverview.onCreated(function () {

})

Template.statusOverview.helpers({
  apps () {
    return componentsLoaded.get() && Apps.all()
  }
})
