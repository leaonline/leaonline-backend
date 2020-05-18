import { Meteor } from 'meteor/meteor'
import { Apps } from '../../api/apps/client/Apps' // note to use client/Apps here
import { ServiceRegistry } from '../../api/config/ServiceRegistry'
import { i18n } from '../../api/i18n/I18n'
import { createCollection } from '../../factories/createCollection'
import { parseContext } from '../../api/config/parseContext'
import { createParentRoute } from '../../api/routes/createParentRoute'
import { createChildRoute } from '../../api/routes/createChildRoute'

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
    parseContext(config)
    createParentRoute(name, config)
    createChildRoute(name, config)
    done(err, config)
  })
})
