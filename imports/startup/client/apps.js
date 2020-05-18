import { Meteor } from 'meteor/meteor'
import { Apps } from '../../api/apps/client/Apps' // note to use client/Apps here
import { ServiceRegistry } from '../../api/config/ServiceRegistry'
import { i18n } from '../../api/i18n/I18n'
import { Router } from '../../api/routes/Router'
import { Routes } from '../../api/routes/Routes'
import { createCollection } from '../../factories/createCollection'

const factorySettings = { name: Apps.name, schema: Apps.schema }
createCollection(factorySettings)

// the following registers a config loader callback and runs a
// parsing mechanism and adds the respective routes to the navigation

Apps.loadConfig(function (name, done) {
  const app = Apps.get(name)
  const { url } = app
  const { connection } = app
  const lang = i18n.getLocale()

  connection.call(ServiceRegistry.methods.get.name, { lang }, (err, config) => {
    if (err) return done(err)
    if (!config) return done(new Error(`Expected config for app ${name}`))

    i18n.add(lang, config.lang)
    ServiceRegistry.parse(config)
    ServiceRegistry.parent(name, config)
    ServiceRegistry.children(name, config)
    done(err, config)
  })
})

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

if (isOfHosts) {
  Router.addLoadDependency(new Promise(resolve => {
    Apps.onHostLoaded(hostName, (err, res) => {
      if (!err && !!res) {
        setTimeout(() => Router.go(pathname), 300)
      }
      resolve()
    })
  }))

  setTimeout(() => Router.go(Routes.loading), 0)
}
