import { Routes } from '../../api/routes/Routes'
import { Router } from '../../api/routes/Router'
import '../../ui/pages/loading/loading'

const defaultTarget = 'main-render-target'

Router.titlePrefix(`lea.online - `)
Router.loadingTemplate('loading')

Object
  .values(Routes)
  .map(route => {
    route.target = (route.target || defaultTarget)
    return route
  })
  .forEach(route => Router.register(route))
