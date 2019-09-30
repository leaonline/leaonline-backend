import { Template } from 'meteor/templating'
import { topLevelRoutes } from '../../../../api/routes/topLevelRoutes'
import './navSide.html'

Template.navSide.helpers({
  topLevelRoutes () {
    return topLevelRoutes
  }
})
