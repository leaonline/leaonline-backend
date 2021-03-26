import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { EJSON } from 'meteor/ejson'
import { StateVariables } from '../../config/StateVariables'
import { StateActions, updateStateAction } from '../../config/StateActions'
import {
  wrapEvents,
  wrapHelpers,
  wrapOnCreated
} from '../../config/backendConfigWrappers'
import { dataTarget } from '../../../utils/event'
import { formIsValid } from '../../../utils/form'
import { getPreviewData } from '../../config/getPreviewData'
import { defaultNotifications } from '../../../utils/defaultNotifications'
import { defineUndefinedFields } from '../../../utils/defineUndefinedFields'
import {
  getQueryParam,
  setQueryParam
} from '../../../api/routes/utils/queryParams'
import { debounce } from '../../../utils/debounce'
import { updateDocumentState } from '../../../utils/updateDocumentState'
import { by300 } from '../../../utils/dely'
import '../../components/upload/upload'
import '../../components/preview/preview'
import './list.html'

const entryIsTrue = entry => entry === true
const validateDocs = instance => function () {
  // some contexts do not define an insert schema
  if (!instance.actionInsertSchema) return

  const ctx = instance.actionInsertSchema.newContext()
  const validationErrors = {}

  // this is to attach validation errors to the table-entry's first column
  // TODO: translate errors
  instance.mainCollection.find().forEach(doc => {
    const { _id, meta, ...rest } = doc
    ctx.validate(rest)
    if (!ctx.isValid()) {
      validationErrors[_id] = ctx.validationErrors()
    }
  })

  instance.state.set({ validationErrors })
}

Template.genericList.onCreated(function () {
  const instance = this
  instance.state.set(StateVariables.docsPerPage, 15)
  instance.state.set(StateVariables.currentPage, 0)

  instance.autorun(() => {
    const data = Template.currentData()
    const { pathname } = window.location
    const lastPath = instance.state.get('lastPath')

    if (lastPath !== pathname) {
      instance.state.clear()
      Tracker.nonreactive(() => wrapOnCreated(instance, {
        data,
        debug: false,
        onSubscribed () {
          const query = instance.state.get('query') || {}
          const transform = instance.state.get('transform') || {}
          const list = instance.mainCollection.find(query, transform).fetch()
          updateList(list, instance)
        }
      }))
      instance.state.set('lastPath', pathname)
    }
  })

  instance.autorun(() => {
    const allSubsComplete = instance.state.get(StateVariables.allSubsComplete)
    if (!allSubsComplete) return

    Tracker.nonreactive(validateDocs(instance))

    // since we may need to dynamically load special form types
    // we need to wait until they are loaded or the form will run into errors
    const formsLoaded = instance.state.get(StateVariables.formTypesLoaded)
    if (formsLoaded && !Object.values(formsLoaded).every(entryIsTrue)) return

    const action = getQueryParam('action')
    const doc = getQueryParam('doc')

    let updateDoc
    if (doc) {
      updateDoc = instance.mainCollection.findOne(doc, { reactive: false })
      if (!updateDoc) {
        console.error('Document', doc, 'not found')
        console.error(instance.mainCollection.find({}, { reactive: false }).fetch())
        return
      }
    }

    updateStateAction({ action, updateDoc, instance })
  })

  instance.autorun(() => {
    const removed = instance.state.get(StateVariables.removed)
    if (!removed) return

    instance.mainCollection.remove(removed)

    const query = instance.state.get('query') || {}
    const transform = instance.state.get('transform') || {}
    const list = instance.mainCollection.find(query, transform).fetch()
    updateList(list, instance)

    instance.state.set(StateVariables.removed, null)
  })
})

Template.genericList.helpers(wrapHelpers({
  loadComplete () {
    return Template.instance().state.get(StateVariables.allSubsComplete)
  },
  list () {
    const instance = Template.instance()
    const list = instance.state.get('list')
    const currentPage = instance.state.get(StateVariables.currentPage) || 0
    const docsPerPage = 15
    const start = currentPage * docsPerPage
    const end = start + docsPerPage
    return list.slice(start, end)
  },
  isCurrentPage (index) {
    return Template.getState(StateVariables.currentPage) === index
  },
  getIndex (index) {
    const instance = Template.instance()
    const currentPage = instance.state.get(StateVariables.currentPage) || 0
    const docsPerPage = 15
    return (currentPage * docsPerPage) + (index + 1)
  },
  pages () {
    return Template.getState(StateVariables.pageCount)
  },
  insertForm () {
    return Template.getState('insertForm')
  },
  updateForm () {
    return Template.getState('updateForm')
  },
  previewTarget () {
    const instance = Template.instance()
    const target = instance.state.get('previewTarget')
    if (!target) return

    return Object.assign({}, target, { onClosed: onClosed.bind(instance) })
  },
  isBoolean (field) {
    return field.type === Boolean
  },
  cellAtts (key, isHeader) {
    const config = Template.instance().fieldConfig[key]
    if (!config) return null

    const isCentered = config.isType || config.type === Boolean
    const alignment = config.alignment || (isCentered && 'center') || 'left'
    const alignmentClass = `text-${alignment}`
    const fullWidth = config.stretch ? 'w-100' : ''
    const noWrap = isHeader ? 'no-wrap' : ''
    const classNames = `${alignmentClass} ${fullWidth} ${noWrap}`
    return {
      class: classNames
    }
  },
  showSearch () {
    return Template.getState('showSearch')
  },
  searchFailed () {
    return Template.getState('searchFailed')
  }
}))

Template.genericList.events(wrapEvents({
  'click .set-page-button' (event, templateInstance) {
    event.preventDefault()
    const index = dataTarget(event, templateInstance)
    templateInstance.state.set(StateVariables.currentPage, index)
  },
  'click .insert-button' (event, templateInstance) {
    event.preventDefault()
    setQueryParam({ action: StateActions.insert })
  },
  'click .edit-button' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    setQueryParam({ action: StateActions.update, doc: target })
  },
  'click .cancel-form-button' (event, templateInstance) {
    event.preventDefault()
    setQueryParam({ action: null })
  },
  'click .current-document-preview-button' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    const doc = templateInstance.mainCollection.findOne(targetId)
    const unsaved = false // no need to compare list docs
    previewDoc(templateInstance, { doc, unsaved })
  },
  // //////////////////////////////////////////////////////
  // FORM EVENTS
  // //////////////////////////////////////////////////////
  'submit #insertForm' (event, templateInstance) {
    event.preventDefault()
    const schema = templateInstance.actionInsertSchema
    const insertDoc = formIsValid('insertForm', schema)
    if (!insertDoc) return

    templateInstance.state.set(StateVariables.submitting, true)
    const actionInsert = templateInstance.state.get('actionInsert')
    const app = templateInstance.data.app()
    const config = templateInstance.data.config()
    const { connection } = app

    connection.call(actionInsert.name, insertDoc, by300((err, insertDocId) => {
      templateInstance.state.set(StateVariables.submitting, false)
      defaultNotifications(err, insertDocId)
        .success(function () {
          updateDocumentState({
            connection: connection,
            context: config,
            docId: insertDocId,
            onComplete () {
              const list = templateInstance.mainCollection.find().fetch()
              updateList(list, templateInstance)
            }
          })
          setQueryParam({ action: null })
        })
    }))
  },
  'click .preview-formDoc-button' (event, templateInstance) {
    event.preventDefault()
    const doc = getUnsavedFormDoc(templateInstance)
    const compare = getCompare(templateInstance)
    previewDoc(templateInstance, { doc, compare })
  },
  'click .show-source-button' (event, templateInstance) {
    event.preventDefault()
    const doc = getUnsavedFormDoc(templateInstance)
    if (!doc) return
    const compare = getCompare(templateInstance)
    const template = 'stringified'
    previewDoc(templateInstance, { doc, compare, template })
  },
  'submit #updateForm' (event, templateInstance) {
    event.preventDefault()

    const updateDoc = formIsValid('updateForm', templateInstance.actionUpdateSchema, { template: templateInstance })
    if (!updateDoc) return

    const target = templateInstance.state.get('updateDoc')

    // we need to clean both documents in case the schema is updated
    // and the target still contains fields that are not part of the schema
    const cleanOptions = {
      mutate: true,
      filter: true,
      autoConvert: true,
      removeEmptyStrings: true
    }

    templateInstance.actionUpdateSchema.clean(updateDoc, cleanOptions)
    templateInstance.actionUpdateSchema.clean(target, cleanOptions)

    updateDoc._id = target._id

    defineUndefinedFields(updateDoc, target)

    templateInstance.state.set(StateVariables.submitting, true)
    const actonUpdate = templateInstance.state.get('actionUpdate')
    const app = templateInstance.data.app()
    const { connection } = app
    connection.call(actonUpdate.name, updateDoc, by300((err, res) => {
      templateInstance.state.set(StateVariables.submitting, false)
      defaultNotifications(err, res)
        .success(function () {
          updateDocumentState({
            context: templateInstance.data.config(),
            connection: connection,
            docId: target._id,
            onComplete () {
              const list = templateInstance.mainCollection.find().fetch()
              updateList(list, templateInstance)
            }
          })
          setQueryParam({ action: null })
        })
    }))
  },
  'click .linked-document-preview-button' (event, templateInstance) {
    event.preventDefault()
    const docId = dataTarget(event, templateInstance)
    const contextName = dataTarget(event, templateInstance, 'context')
    const appName = templateInstance.data.app().name
    const previewTarget = getPreviewData({ docId, contextName, appName })
    templateInstance.state.set({ previewTarget })
  },
  'click .search-button' (event, templateInstance) {
    event.preventDefault()
    const showSearch = !templateInstance.state.get('showSearch')
    templateInstance.state.set({ showSearch })
    setTimeout(() => {
      templateInstance.$('.list-search-input').focus()
    }, 100)
  },
  'click .close-search-button' (event, templateInstance) {
    event.preventDefault()
    const fullList = templateInstance.mainCollection.find({}, { reactive: false }).fetch()
    updateList(fullList, templateInstance)
    templateInstance.state.set({
      showSearch: false,
      searchFailed: false
    })
  },
  'input .list-search-input': debounce((event, templateInstance) => {
    event.preventDefault()
    const value = templateInstance.$(event.currentTarget).val().trim().toLowerCase()
    const transform = templateInstance.state.get('transform')
    if (value.length < 2) {
      const fullList = templateInstance.mainCollection.find({}, { reactive: false }).fetch()
      templateInstance.state.set({
        searchFailed: false
      })
      return updateList(fullList, templateInstance)
    }

    let indices

    try {
      indices = getSearchIndices({ value, templateInstance })
    } catch (e) {
      console.error(e)
      indices = []
    }

    if (indices.length === 0) {
      return templateInstance.state.set({ searchFailed: true })
    }

    const query = { _id: { $in: indices } }
    const filteredDocs = templateInstance.mainCollection.find(query, transform).fetch()

    templateInstance.state.set({
      searchFailed: false
    })

    updateList(filteredDocs, templateInstance)
  }, 500)
}))

function getSearchIndices ({ value, templateInstance }) {
  return templateInstance.mainCollection
    .find()
    .map(doc => {
      const found = templateInstance.fieldLabels.some(({ key }) => {
        const config = templateInstance.fieldConfig[key]
        const resolver = config?.resolver
        let fieldValue = resolver ? resolver(doc[key]) : doc[key]

        if (fieldValue === undefined || fieldValue === null) {
          return false
        }

        if (config.dependency) {
          const { doc } = fieldValue

          if (!doc || !doc.label) {
            return false
          }

          return String(doc.label).toLowerCase().includes(value)
        }

        // some simple fields are split int { type, value }
        // so we need to extract their value
        fieldValue = Object.hasOwnProperty.call(fieldValue, 'value')
          ? fieldValue.value
          : fieldValue

        if (config.type === String) {
          return fieldValue && fieldValue.toLowerCase().includes(value)
        }

        return config.type === Number && fieldValue.toString().includes(value)
      })

      return found && doc._id
    })
    .filter(entry => !!entry)
}

function onClosed () {
  this.state.set('previewTarget', null)
}

function previewDoc (templateInstance, { doc, unsaved, compare, template, titleField }) {
  if (!doc) return console.warn('Attempt to preview undefined doc')

  const previewTarget = { doc, unsaved, template, titleField }

  if (typeof unsaved === 'undefined') {
    previewTarget.unsaved = EJSON.stringify(doc) !== EJSON.stringify(compare)
  }

  if (typeof template === 'undefined') {
    const renderer = templateInstance.state.get(StateVariables.actionPreview)
    previewTarget.template = renderer?.template
  }

  if (typeof titleField === 'undefined') {
    const config = templateInstance.data.config()
    previewTarget.titleField = config.representative
  }

  templateInstance.state.set({ previewTarget })
}

function getUnsavedFormDoc (templateInstance) {
  const isUpdateForm = !!templateInstance.state.get('updateDoc')
  const targetForm = isUpdateForm
    ? 'updateForm'
    : 'insertForm'
  const schema = isUpdateForm
    ? templateInstance.actionUpdateSchema
    : templateInstance.actionInsertSchema
  return formIsValid(targetForm, schema)
}

function getCompare (templateInstance) {
  const updateDoc = templateInstance.state.get('updateDoc')
  if (updateDoc) delete updateDoc._id
  return updateDoc
}

/**
 * Prepares the list of documents for rendering.
 * This allows us to avoid lots of computations in the helpers.
 * @param list
 * @param instance
 * @return {*}
 */
function prepareList (list, instance) {
  const validationErrors = instance.state.get('validationErrors') || {}
  const { fieldConfig } = instance
  const fields = instance.state.get(StateVariables.documentFields)

  return list.map(document => {
    return {
      trAtts: getTableRowAttributes(document, validationErrors),
      fields: getTableRowFields(document, fieldConfig, fields),
      document: document
    }
  })
}

function getTableRowAttributes (document, validationErrors) {
  const docId = document._id
  const errorClass = Array.isArray(validationErrors[docId])
    ? 'bg-warning'
    : ''

  const classNames = `text-muted ${errorClass}`
  const atts = { class: classNames }

  if (errorClass.length > 0) {
    let errorsTitle = ''
    validationErrors[docId].forEach(error => {
      errorsTitle += `${error.name} - ${error.type}\n`
    })

    atts.title = errorsTitle
  }

  return atts
}

function getTableRowFields (document, fieldConfig, fields) {
  return fields && fields.map(key => {
    const value = document[key]
    const config = fieldConfig[key]
    const resolver = config?.resolver

    if (!resolver) {
      return value
    } else {
      const resolvedValue = resolver(value)
      const type = Object.prototype.toString.call(value)

      if (type === '[object Boolean]') {
        resolvedValue.isBoolean = true
      }

      if (type === '[object Date]') {
        resolvedValue.isDate = true
      }

      return resolvedValue
    }
  })
}

function updateList (list, templateInstance) {
  const prepared = prepareList(list, templateInstance)
  const docsPerPage = 15
  const count = list.length
  const numberOfPages = Math.ceil(count / docsPerPage)
  const pageCount = []
  for (let i = 0; i < numberOfPages; i++) pageCount[i] = i + 1

  templateInstance.state.set({
    list: prepared,
    [StateVariables.currentPage]: 0,
    [StateVariables.pageCount]: pageCount
  })
}
