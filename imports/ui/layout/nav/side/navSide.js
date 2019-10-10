import { Template } from 'meteor/templating'
import { RoutesTree } from '../../../../api/routes/topLevelRoutes'
import './navSide.html'

const topLevelRoutes = RoutesTree.get()

Template.navSide.helpers({
  topLevelRoutes () {
    return topLevelRoutes
  }
})
