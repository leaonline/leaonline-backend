import { Meteor } from 'meteor/meteor'
import { Apps } from '../../api/apps/Apps'
import { createCollection } from '../../factories/createCollection'
import { createMethods } from '../../factories/createMethods'
import { rateLimitMethods, rateLimitPublications } from '../../factories/rateLimit'
import { createPublications } from '../../factories/createPublication'

createCollection(Apps)

const methods = Object.values(Apps.methods)
createMethods(methods)
rateLimitMethods(methods)

const publications = Object.values(Apps.publications)
createPublications(publications)
rateLimitPublications(publications)

const { hosts } = Meteor.settings
const allHosts = Object.values(hosts)

Meteor.startup(() => {
  const { hosts } = Meteor.settings
  allHosts.forEach(Apps.register)
})
