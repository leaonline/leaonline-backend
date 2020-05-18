import { onServer } from '../../utils/arch'

export const Apps = {
  name: 'apps',
  label: 'apps.title',
  icon: 'cubes',
  debug: false
}

// Note, that the schema is normalized to map one context to one document.
// Registering an app may result in multiple context documents at once.

Apps.schema = {
  // name of the app that registered to the backend
  name: String,

  // name of the context that has been registered
  context: String,

  // edit log / history flag
  useHistory: Boolean,

  // comments flag
  useComments: Boolean,

  // flag if we want to track links to this context
  useDependencyTracking: Boolean,

  // which template to use as main template for overview
  template: String,

  // define fields-specific settings
  fields: Array,
  'fields.$': Object,

  // field name / key (not label)
  'fields.$.name': String,

  // may it appear in lists
  'fields.$.list': Boolean,

  // may it appear in summaries and previews
  'fields.$.summary': Boolean,

  // is there a specific autoform formType to use
  'fields.$.formType': Boolean,
}

Apps.methods = {}

Apps.methods.getServiceCredentials = {
  name: 'apps.methods.getServiceCredentials',
  schema: {},
  numRequests: 5,
  timeInterval: 500,
  run: onServer(function () {
    const user = Meteor.users.findOne(this.userId)
    return user.services.lea
  }),
  call: function (cb) {
    Meteor.call(Apps.methods.getServiceCredentials.name, cb)
  }
}

Apps.methods.updateSettings = {
  name: 'apps.methods.updateSettings',
  schema: Apps.schema,
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(function (settingsDoc) {
    const existingDocId = Apps.collection().findOne({ name: settingsDoc.name, context: settingsDoc.context })
    if (existingDocId) {
      return Apps.collection().update(existingDocId, { $set: settingsDoc })
    } else {
      return Apps.collection().insert(settingsDoc)
    }
  })
}

Apps.publications = {}

Apps.publications.getByNames = {
  name: 'apps.publications.getByNames',
  schema: {
    names: Array,
    'names.$': String
  },
  numRequests: 5,
  timeInterval: 500,
  run: onServer(function ({ names = [] }) {
    return Apps.collection().find({ name: { $in: names } })
  }),
}
