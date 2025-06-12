import { Template } from 'meteor/templating'
import { RoutesTree } from '../../../../api/routes/topLevelRoutes'
import './navSide.scss'
import './navSide.html'

Template.navSide.helpers({
  topLevelRoutes() {
    const routes = RoutesTree.get()
    return routes
  },
})
