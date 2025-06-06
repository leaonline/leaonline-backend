import { Meteor } from 'meteor/meteor'
import validateSettings from '../../../.settingsschema'

describe(validateSettings.name, () => {
  it('has valid settings', () => {
    const settings = { ...Meteor.settings }
    delete settings.public.mochaRuntimeArgs
    validateSettings(Meteor.settings)
  })
})
