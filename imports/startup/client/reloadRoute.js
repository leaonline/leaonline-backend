import { Meteor } from 'meteor/meteor'
import { Apps } from '../../api/apps/client/Apps'
import { Router } from '../../api/routes/Router'
import { Routes } from '../../api/routes/Routes'

// The following part is to reload the current route after
// the app's context has been registered in order to
// have the registered route available and prevent "notfound" pages

const { hosts } = Meteor.settings.public
const allHosts = Object.values(hosts)
allHosts.forEach(host => Apps.register(host))

const pathname = window.location.pathname
const location = pathname.split('/')
location.shift()

const hostName = location[0]
const isOfHosts = !!hosts[hostName]

// we use this as a relative path + queryParams in order to
// fully restore the template state (in case the template supports it)
const fullPath = `${pathname}${window.location.search}`

if (isOfHosts) {
  Router.addLoadDependency(new Promise(resolve => {
    Apps.onHostLoaded(hostName, (err, res) => {
      if (!err && !!res) {
        setTimeout(() => Router.go(fullPath), 300)
      }
      resolve()
    })
  }))

  setTimeout(() => Router.go(Routes.loading), 0)
}
