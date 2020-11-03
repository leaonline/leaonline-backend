import { Meteor } from 'meteor/meteor'

export const getDebug = (instance, debug) => {
  if (debug) {
    return (...args) => {
      if (Meteor.isDevelopment) {
        console.info(`[${instance.view.name}]`, ...args)
      }
    }
  }

  return () => {}
}
