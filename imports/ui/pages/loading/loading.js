import { Template } from 'meteor/templating'
import 'meteor/leaonline:ui/components/icon/icon'
import './loading.html'

Template.loadPage.onCreated(function () {
  const instance = this
  if (!instance.data.whileWaiting) {
    instance.data.fallback()
  }
})

export const loadingTemplate = 'loadPage'
