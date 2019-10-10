import './overview.html'
import { Apps } from '../../../api/apps/Apps'

Template.statusOverview.onCreated(function () {

})

Template.statusOverview.helpers({
  apps () {
    return Apps.collection().find()
  }
})