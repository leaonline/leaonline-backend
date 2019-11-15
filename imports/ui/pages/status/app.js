import { Template } from 'meteor/templating'
import { Apps } from '../../../api/apps/Apps'
import './app.html'

Template.statusApp.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()
    const { params } = data
    const { appId } = params

    if (!appId) {
      throw new Error(`Expected appId, got ${appId}`)
    }
    console.log(Apps.connect(appId))
    instance.state.set('appId', appId)
  })
})

Template.statusApp.helpers({
  currentApp () {
    const appId = Template.getState('appId')
    return Apps.get(appId)
  }
})
