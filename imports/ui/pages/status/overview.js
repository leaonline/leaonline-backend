import { Template } from 'meteor/templating'
import { Apps } from '../../../api/apps/Apps'
import { LeaCoreLib } from '../../../api/core/LeaCoreLib'
import './overview.html'

const components = LeaCoreLib.components
const componentsLoaded = components.load([
  components.template.icon
])

Template.statusOverview.onCreated(function () {

})

Template.statusOverview.helpers({
  apps () {
    return componentsLoaded.get() && Apps.all()
  }
})
