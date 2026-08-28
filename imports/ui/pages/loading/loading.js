import { Template } from 'meteor/templating'
import 'meteor/leaonline:ui/components/icon/icon'
import './loading.html'

Template.loadPage.onCreated(function () {
  if (!this.data.whileWaiting) {
    this.data.fallback()
  }
})

export const loadingTemplate = 'loadPage'
