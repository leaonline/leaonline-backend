import { onServer } from '../../utils/arch'
import { getConfigTypeOptions } from '../config/getConfigTypeOptions'
import { getFormTypeOptions } from '../../ui/forms/getFormTypeOptions'
import { getAlignmentOptions } from '../../ui/layout/definitions/getAlignmentOptions'
import { firstOption } from '../../utils/firstOption'

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
  name: {
    type: String,
    label: 'apps.name',
    autoform: {
      type: 'hidden'
    }
  },

  // name of the context that has been registered
  context: {
    type: String,
    label: 'apps.context',
    autoform: {
      type: 'hidden'
    }
  },

  // edit log / history flag
  useHistory: {
    type: Boolean,
    label: 'apps.useHistory',
    optional: true,
    defaultValue: true
  },

  // comments flag
  useComments: {
    type: Boolean,
    label: 'apps.useComments',
    optional: true,
    defaultValue: true
  },

  // flag if we want to track links to this context
  useDependencyTracking: {
    type: Boolean,
    label: 'apps.useDependencyTracking',
    optional: true,
    defaultValue: true
  },

  // which template to use as main template for overview
  viewType: {
    type: String,
    label: 'apps.viewType',
    autoform: {
      options: getConfigTypeOptions
    }
  },

  // define fields-specific settings
  fields: {
    type: Array,
    label: 'apps.fields.title',
    optional: true
  },
  'fields.$': {
    type: Object,
    label: 'apps.field',
  },
  'fields.$.name': {
    type: String,
    label: 'common.name',
  },
  'fields.$.exclude': {
    type: Boolean,
    label: 'apps.fields.exclude',
    optional: true
  },
  'fields.$.hideLabel': {
    type: Boolean,
    label: 'apps.fields.hideLabel',
    optional: true
  },
  'fields.$.alignment': {
    type: String,
    label: 'apps.fields.alignment',
    optional: true,
    autoform: {
      firstOption: firstOption,
      options: getAlignmentOptions
    }
  },
  'fields.$.form': {
    type: String,
    label: 'apps.fields.form',
    optional: true,
    autoform: {
      firstOption: firstOption,
      options: getFormTypeOptions
    }
  }
}

Apps.settings = {
  fieldIncluded(field) {
    return field && field.excluded !== true
  },
  labelIncluded (field) {
    return field && field.hideLabel !== true
  }
}

Apps.getSchemaForContext = (context) => {
  const fields = Object.keys(context.schema)
  const schema = Object.assign({}, Apps.schema)
  Object.assign(schema['fields.$.name'], {
    allowedValues: fields
  })
  return schema
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
