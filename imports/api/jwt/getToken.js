import { Meteor } from 'meteor/meteor'
import { createJWTFactory } from 'meteor/leaonline:jwt'

const url = Meteor.absoluteUrl()
const factories = new Map()

/**
 * Get a JWT token for the given host and scope.
 * @param hostName {string} name of the host to get the token for, must be defined in Meteor.settings.hosts
 * @param scope {string} name of the method or publication the token is valid for
 * @param compact {boolean} whether to return a compact token (without header and signature) or a full token
 * @param expires {number} optional expiration time in seconds, overrides the default expiration time defined in Meteor.settings.hosts[hostName].jwt.expires
 * @return {*}
 */
export const getToken = ({ hostName, scope, compact, expires }) => {
  if (!Object.hasOwn(Meteor.settings.hosts, hostName)) {
    throw new Error(`Invalid host settings: ${hostName}`)
  }
  if (!factories.has(hostName)) {
    const host = Meteor.settings.hosts[hostName]
    const factory = createJWTFactory({
      url: url.substring(0, url.length - 1),
      key: host.jwt.key,
      sub: host.jwt.sub,
      expires: host.jwt.expires,
    })
    factories.set(hostName, factory)
  }
  const getToken = factories.get(hostName)
  return getToken({ name: scope, compact, expires })
}
