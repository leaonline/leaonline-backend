import { ReactiveDict } from 'meteor/reactive-dict'
import { HTTP } from 'meteor/http'
import { Template } from 'meteor/templating'
import { Schema } from '../../../api/schema/Schema'
import './autoform'
import './h5p.html'
import { formIsValid } from '../../../utils/form'

const createContentFormSchema = Schema.create({
  contentId: String
})

Template.afH5P.onCreated(function () {
  const instance = this
  instance.state = new ReactiveDict()
  console.log(instance.data)
  const { data } = instance
  const { atts } = data

  const { h5p } = atts
  const { createUrl } = h5p
  const { editUrl } = h5p
  const { playUrl } = h5p
  const { listUrl } = h5p

  const { value } = data
  instance.state.set('contentId', value)
  instance.state.set('createUrl', createUrl)
  instance.state.set('listUrl', listUrl)
  instance.state.set('editUrl', editUrl)
  instance.state.set('playUrl', playUrl)
  instance.state.set('dataSchemaKey', atts['data-schema-key'])

  HTTP.get(listUrl, (err, res) => {
    if (err) return console.error(err) // todo display in Template
    const contentList = JSON.stringify(res.content)
    console.log(contentList)
  })
})

Template.afH5P.helpers({
  listUrl () {
    return Template.instance().state.get('listUrl')
  },
  createUrl () {
    return Template.instance().state.get('createUrl')
  },
  editUrl (contentId) {
    return Template.instance().state.get('editUrl') + contentId
  },
  playUrl (contentId) {
    return Template.instance().state.get('playUrl') + contentId
  },
  editMode () {
    return Template.instance().state.get('editMode')
  },
  contentId () {
    return Template.instance().state.get('contentId')
  },
  dataSchemaKey () {
    return Template.instance().state.get('dataSchemaKey')
  },
  createContentFormSchema () {
    return createContentFormSchema
  }
})

const windows = {}

Template.afH5P.events({
  'click .close-edit-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('editMode', null)
  },
  'click .create-new-content-button' (event, templateInstance) {
    event.preventDefault()
    const createUrl = templateInstance.state.get('createUrl')
    windows[createUrl] = window.open(createUrl, createUrl)
  },
  'click .edit-content-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('editMode', true)
  },
  'submit #createNewContentForm' (event, templateInstance) {
    event.preventDefault()

    const insertDoc = formIsValid('createNewContentForm', createContentFormSchema)
    if (!insertDoc) return

    // TODO check against new loaded content list if contentId is present in updated list
    // TODO using listUrl and HTTP.get request
    const contentId = insertDoc.contentId

    templateInstance.$('.afH5PContentHiddenInput').val(contentId)
    templateInstance.state.set('contentId', contentId)
  }
})
