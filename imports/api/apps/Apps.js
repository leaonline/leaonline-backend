import { Meteor } from 'meteor/meteor'
import { onServer } from '../../utils/arch'
import { getConfigTypeOptions } from '../config/getConfigTypeOptions'
import { getFormTypeOptions } from '../../ui/forms/getFormTypeOptions'
import { getAlignmentOptions } from '../../ui/layout/definitions/getAlignmentOptions'
import { firstOption } from '../../utils/firstOption'
import { transformLabelsToTranslation } from '../../ui/config/transformLabelsToTranslation'
import { getOptionsFromSchema } from '../../ui/config/getOptionsFromSchema'
import { getPrewiewRenderers } from '../../ui/config/getPrewiewRenderers'

export const Apps = {
  name: 'apps',
  label: 'apps.title',
  icon: 'cubes',
  debug: false,
}

// Note, that the schema is normalized to map one context to one document.
// Registering an app may result in multiple context documents at once.

Apps.schema = {
  // name of the app that registered to the backend
  name: {
    type: String,
    label: 'apps.name',
    autoform: {
      type: 'hidden',
    },
  },

  // name of the context that has been registered
  context: {
    type: String,
    label: 'apps.context',
    autoform: {
      type: 'hidden',
    },
  },

  // edit log / history flag
  useHistory: {
    type: Boolean,
    label: 'apps.useHistory',
    optional: true,
    defaultValue: true,
  },

  // comments flag
  useComments: {
    type: Boolean,
    label: 'apps.useComments',
    optional: true,
    defaultValue: true,
  },

  // flag if we want to track links to this context
  useDependencyTracking: {
    type: Boolean,
    label: 'apps.useDependencyTracking',
    optional: true,
    defaultValue: true,
  },

  // which template to use as main template for overview
  viewType: {
    type: String,
    label: 'viewTypes.title',
    autoform: {
      firstOption,
      options: getConfigTypeOptions,
    },
  },

  // which renderer to use to preview documents
  previewType: {
    type: String,
    optional: true,
    label: 'previewTypes.title',
    autoform: {
      firstOption,
      options: getPrewiewRenderers(),
    },
  },

  // define fields-specific settings
  fields: {
    type: Array,
    label: 'apps.fields.title',
    optional: true,
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
    optional: true,
  },
  'fields.$.hideLabel': {
    type: Boolean,
    label: 'apps.fields.hideLabel',
    optional: true,
  },
  'fields.$.stretch': {
    type: Boolean,
    label: 'apps.fields.stretch',
    optional: true,
  },
  'fields.$.alignment': {
    type: String,
    label: 'alignment.title',
    optional: true,
    autoform: {
      firstOption,
      options: getAlignmentOptions,
    },
  },
  'fields.$.display': {
    type: String,
    label: 'apps.fields.display.title',
    optional: true,
    autoform: {
      firstOption,
      options: function () {
        return [
          { value: 'default', label: 'apps.fields.display.default' },
          { value: 'code', label: 'apps.fields.display.code' },
        ]
      },
    },
  },
  'fields.$.form': {
    type: String,
    label: 'apps.fields.form',
    optional: true,
    autoform: {
      firstOption,
      options: getFormTypeOptions,
    },
  },
}

Apps.getSchemaForContext = (context) => {
  const fields = getOptionsFromSchema(context)
  const schema = Object.assign({}, Apps.schema)
  transformLabelsToTranslation(schema)
  Object.assign(schema['fields.$.name'], {
    autoform: {
      firstOption,
      options: fields,
    },
  })
  return schema
}

Apps.methods = {}

Apps.methods.getServiceCredentials = {
  name: 'apps.methods.getServiceCredentials',
  schema: {},
  numRequests: 5,
  timeInterval: 500,
  run: onServer(async function () {
    const user = await Meteor.users.findOneAsync(this.userId)
    return user?.services?.lea
  }),
  call: function (cb) {
    Meteor.call(Apps.methods.getServiceCredentials.name, cb)
  },
}

Apps.methods.updateSettings = {
  name: 'apps.methods.updateSettings',
  schema: Apps.schema,
  numRequests: 1,
  timeInterval: 1000,
  run: onServer(async function (settingsDoc) {
    const existingDocId = await Apps.collection().findOneAsync({
      name: settingsDoc.name,
      context: settingsDoc.context,
    })
    if (existingDocId) {
      return await Apps.collection().updateAsync(existingDocId, {
        $set: settingsDoc,
      })
    } else {
      return await Apps.collection().insertAsync(settingsDoc)
    }
  }),
}

Apps.publications = {}

Apps.publications.getByNames = {
  name: 'apps.publications.getByNames',
  schema: {
    appName: String,
    contextName: String,
  },
  numRequests: 5,
  timeInterval: 500,
  run: onServer(async function ({ appName, contextName }) {
    return Apps.collection().find({ name: appName, context: contextName })
  }),
}

Apps.publications.all = {
  name: 'apps.publications.all',
  schema: {},
  log: function (...args) {
    console.log(...args)
  },
  numRequests: 5,
  timeInterval: 500,
  run: onServer(async function () {
    return Apps.collection().find()
  }),
}
