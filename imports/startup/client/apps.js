import { Meteor } from 'meteor/meteor'
import { Apps } from '../../api/apps/Apps'
import { Router } from '../../api/routes/Router'
import { Routes } from '../../api/routes/Routes'

Apps.debug = false
const { hosts } = Meteor.settings.public
const allHosts = Object.values(hosts)
allHosts.forEach(host => Apps.register(host))

const pathname = window.location.pathname
const location = pathname.split('/')
location.shift()

const hostName = location[0]
const isOfHosts = !!hosts[hostName]

if (isOfHosts) {
  Router.addLoadDependency(new Promise(resolve => {
    Apps.onHostLoaded(hostName,(err, res) => {
      if (!err && !!res) {
        setTimeout(() => Router.go(pathname), 300)
      }
      resolve()
    })
  }))

  setTimeout(() => Router.go(Routes.loading), 0)
}
