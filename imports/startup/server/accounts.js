/* global ServiceConfiguration */
import { Meteor } from 'meteor/meteor'
import { rateLimitAccounts } from '../../factories/rateLimit'

rateLimitAccounts()

Meteor.startup(async () => {
  const { oauth } = Meteor.settings
  await ServiceConfiguration.configurations.upsertAsync(
    { service: 'lea' },
    {
      $set: {
        loginStyle: 'popup',
        clientId: oauth.clientId,
        secret: oauth.secret,
        dialogUrl: oauth.dialogUrl,
        accessTokenUrl: oauth.accessTokenUrl,
        identityUrl: oauth.identityUrl,
        redirectUrl: oauth.redirectUrl,
        debug: true,
      },
    },
  )
})
