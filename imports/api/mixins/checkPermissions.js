import { Meteor } from 'meteor/meteor'

export const checkPermissions = function (options) {
  if (options.isPublic) return options

  const runFct = options.run
  options.run = async function run (...args) {
    const { userId } = this
    if (!userId) {
      throw new Meteor.Error('errors.permissionDenied', 'errors.userNotExists', { userId })
    }

    return runFct.call(this, ...args)
  }

  return options
}
