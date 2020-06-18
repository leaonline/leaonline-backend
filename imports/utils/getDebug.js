import { Meteor } from 'meteor/meteor'

export const getDebug = (instance, debug) => debug
  ? (...args) => {
    if (Meteor.isDevelopment) {
      console.info(`[${instance.view.name}]`, ...args)
    }
  }
  : () => {}
