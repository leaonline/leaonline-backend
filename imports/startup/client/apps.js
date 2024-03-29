import { Meteor } from 'meteor/meteor'
import { Apps } from '../../api/apps/client/Apps' // note to use client/Apps here
import { ServiceRegistry } from '../../api/config/ServiceRegistry'
import { i18n } from '../../api/i18n/i18n'
import { createCollection } from '../../factories/createCollection'
import { parseContext } from '../../api/config/parseContext'
import { createParentRoute } from '../../api/routes/createParentRoute'
import { createChildRoute } from '../../api/routes/createChildRoute'

const factorySettings = { name: Apps.name, schema: Apps.schema }
const AppsCollection = createCollection(factorySettings)
Apps.collection = () => AppsCollection

Meteor.subscribe(Apps.publications.all.name)

// the following registers a config loader callback and runs a
// parsing mechanism and adds the respective routes to the navigation

Apps.loadConfig((name, done) => {
  const app = Apps.get(name)
  const { connection } = app
  const lang = i18n.getLocale()

  connection.call(ServiceRegistry.methods.get.name, { lang }, (err, config) => {
    if (err) return done(err)
    if (!config) return done(new Error(`Expected config for app ${name}`))

    i18n.set(lang, config.lang)
    parseContext(name, config)
    createParentRoute(name, config)
    createChildRoute(name, config)
    done(err, config)
  })
})
