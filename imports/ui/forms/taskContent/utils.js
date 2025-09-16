import { Random } from 'meteor/random'
import { EJSON } from 'meteor/ejson'
import { Scoring } from '../../../api/task/Scoring'
import { formIsValid } from '../../../utils/form'
import { ContextRegistry } from '../../../api/config/ContextRegistry'
import { CurrentTypeSchema } from './CurrentTypeSchema'
import { getCollection } from '../../../utils/collection'
import { Meteor } from 'meteor/meteor'

export const TaskContentUtils = {}

/**
 * extract content elements from page.
 * @param value
 * @return {object[]}
 */
TaskContentUtils.getElements = (value) => {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'object' && value.content) {
    return value.content
  }
  return value || []
}

/**
 * updates the underlying input field with the new elements.
 * @param elements {object[]}
 * @param templateInstance
 */
TaskContentUtils.updateElements = (elements, templateInstance) => {
  const val = EJSON.stringify(elements)
  const dsk = templateInstance.data.atts['data-schema-key']
  templateInstance.$(`[data-schema-key="${dsk}"]`).val(val)
  templateInstance.stateVars.set({ elements })
}


TaskContentUtils.createOnItemInput = (templateInstance) => {
   /**
   * Handler for scoring item inputs in preview mode
   * @param userId
   * @param sessionId
   * @param taskId
   * @param page
   * @param type
   * @param subtype
   * @param responses
   */
   const onItemInput = ({
    userId,
    sessionId,
    taskId,
    page,
    type,
    subtype,
    responses
  }) => {
    const previewContent = templateInstance.stateVars.get('previewContent')
    if (!previewContent) {
      console.warn('[TaskContent]: no content to submit onItemInput')
      return
    }

    const itemDoc = previewContent.value // item docs are stored in value
    const responseDoc = { responses }
    const scoreResults = Scoring.run(subtype, itemDoc, responseDoc)
    const scoreContent = {
      type: 'preview',
      subtype: Scoring.name,
      scores: scoreResults,
    }

    const allScoresTrue = scoreResults.every((entry) => entry.score)
    templateInstance.stateVars.set({ scoreContent, responses, allScoresTrue })
  }
  return onItemInput
}

/**
 * Create a item content element.
 * @param name
 * @param value
 * @return {{subtype, width: string, type: string, value}}
 */
TaskContentUtils.contentFromItem = (name, value) => ({
  type: 'item',
  subtype: name,
  value,
  width: '12',
})

/**
 * Get the content of an element if it is NOT an item type.
 * @param element
 * @return {*}
 */
TaskContentUtils.getContent = (element) => {
  if (element.type !== 'item') {
    return element
  }

  const context = ContextRegistry.get(element.subtype)
  if (!context) {
    throw new Error(`Missing context for subtype ${element.subtype}`)
  }
  const collection = getCollection(context.name)
  element.value = collection.findOne(element.value)

  return element
}

/**
 * Check if the given name is an item type.
 * @param name {string}
 * @return {boolean}
 */
TaskContentUtils.isItem = (name) => {
  const context = ContextRegistry.get(name)
  return !!(context?.isItem)
}

TaskContentUtils.submitForms = (formId, templateInstance) => {
  const name = templateInstance.stateVars.get('currentTypeToAdd')
  const insertDoc = formIsValid(formId, CurrentTypeSchema.get())
  if (!insertDoc) return

  const elements = templateInstance.stateVars.get('elements') || []
  const currentElementIndex = templateInstance.stateVars.get(
    'currentElementIndex',
  )

  const contentElementDoc = TaskContentUtils.isItem(name)
    ? TaskContentUtils.contentFromItem(name, insertDoc)
    : insertDoc

  const currentElementDoc = elements[currentElementIndex]
  if (currentElementDoc) {
    if (currentElementDoc.contentId) {
      contentElementDoc.contentId = currentElementDoc.contentId
    } else {
      contentElementDoc.contentId = Random.id()
    }
    elements.splice(currentElementIndex, 1, contentElementDoc)
  } else {
    contentElementDoc.contentId = Random.id()
    elements.push(contentElementDoc)
  }

  TaskContentUtils.updateElements(elements, templateInstance)
  templateInstance.$('#taskContentModel').modal('hide')
}

TaskContentUtils.createItemData = ({ unitId, page, subtype, onInput }) => {
  const data = {}
  data.userId = Meteor.userId()
  data.sessionId = 'testSession'
  data.unitId = unitId
  data.page = page
  data.subtype = subtype
  data.onInput = onInput
  return data
}