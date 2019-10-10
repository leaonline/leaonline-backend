import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { rateLimitAccounts } from '../../factories/rateLimit'

rateLimitAccounts()

if (Meteor.isDevelopment) {
  Meteor.startup(() => {
    if (Meteor.users.find().count() === 0) {
      const userId = Accounts.createUser({ username: 'admin', password: 'password' })
      console.info(`Devmode: user created with id ${userId} - login via admin / password`)
    }
  })
}
