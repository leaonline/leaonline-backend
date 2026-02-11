import { ReactiveVar } from 'meteor/reactive-var'
import { TaskContentUtils as Utils } from './utils'
import { Schema } from '../../../api/schema/Schema'
import { ContextRegistry } from '../../../api/config/ContextRegistry'
import { toFormSchema } from '../../config/toFormSchema'
import { Apps } from '../../../api/apps/Apps'
import { parseCollections } from '../../config/collection/parseCollections'
import { loadDocumentsWithDependencies } from '../../config/loadDocumentsWithDependencies'
import { FormTypes } from '../FormTypes'
import { TaskRenderers } from '../../../api/task/TaskRenderers'
import { i18n } from '../../../api/i18n/i18n'

export const CurrentTypeSchema = {}

let _currentTypeSchema = null
const hasSchema = new ReactiveVar(false)
const typeSchemas = {}

CurrentTypeSchema.get = () => _currentTypeSchema

CurrentTypeSchema.has = () => hasSchema.get()

CurrentTypeSchema.reset = () => {
  _currentTypeSchema = null
  hasSchema.set(false)
}

CurrentTypeSchema.create = (name, templateInstance) => {
  const { settingsDoc, app, version, connection, filesCollection } =
    templateInstance.data.atts

  _currentTypeSchema = currentTypeSchema({
    name,
    imagesCollection: filesCollection,
    uriBase: connection._stream.rawUrl,
    version,
    app,
    settingsDoc,
  })
  setTimeout(() => hasSchema.set(true), 300)
}

/**
 * Creates a schema definition for the given type.
 * @private
 * @param name
 * @param imagesCollection
 * @param version
 * @param uriBase
 * @param app
 * @param settingsDoc
 * @return {*}
 */
const currentTypeSchema = ({
  name,
  imagesCollection,
  version,
  uriBase,
  app,
  settingsDoc,
}) => {
  const imageForm = getImageForm({ imagesCollection, version, uriBase })
  if (!typeSchemas[name]) {
    const isItemContent = Utils.isItem(name)
    const typeSchemaDef = isItemContent
      ? getItemSchema({ name, app, settingsDoc })
      : createTypeSchemaDef({ name, imageForm })
    typeSchemas[name] = Schema.create(typeSchemaDef)
  }
  return typeSchemas[name]
}

const getItemSchema = ({ name, app, settingsDoc }) => {
  const config = ContextRegistry.get(name)
  loadDependencies(config, app)
  const schema = config.schema
  return toFormSchema({ schema, config, settingsDoc, app })
}

const loadDependencies = (config, appName) => {
  const dependencies = config.dependencies || []
  const app = Apps.get(appName)
  const { connection } = app

  dependencies
    .map((name) => ContextRegistry.get(name))
    .forEach((dependency) => {
      const instance = {}
      parseCollections({
        config: dependency,
        connection,
        instance,
      })

      loadDocumentsWithDependencies({
        config: dependency,
        connection,
        instance: null,
        logDebug: (...args) => console.log(...args),
        onSubscribed: () => console.log('subscribed', config.name),
      })
    })
}

const getImageForm = ({
  imagesCollection,
  save = 'url',
  uriBase,
  version,
}) => ({
  type: FormTypes.imageSelect.template,
  imagesCollection,
  save,
  uriBase,
  version,
})

const createTypeSchemaDef = ({ name, imageForm }) => {
  const renderer = TaskRenderers.get(name)
  if (!renderer) throw new Error(`Expected renderer for name ${name}`)
  return renderer.schema({ i18n: i18n.get, name, imageForm })
}
