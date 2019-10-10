import { RoutesTree } from '../../api/routes/topLevelRoutes'
import { Routes } from '../../api/routes/Routes'
import { Apps } from '../../api/apps/Apps'
import { createCollection} from '../../factories/createCollection'

createCollection(Apps)
Apps.publications.all.subscribe()

/*
let routesCreated  = false

Tracker.autorun(() => {
  const appsSub = Apps.publications.all.subscribe()
  if (appsSub.ready()) {
    if (!routesCreated) {
      const mappedHosts = Apps.collection().find().fetch().map(host => {
        return {
          label: host.name,
          args: [ host.short ]
        }
      })
      RoutesTree.children(Routes.statusOverview.path(), Routes.statusApp, mappedHosts)
      routesCreated = true
    }
  }
})
*/
