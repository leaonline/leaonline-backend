import { EJSON } from 'meteor/ejson'
import { Template } from 'meteor/templating'
import highlight from 'highlight.js/lib/core'
import jsonLang from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/github.css'
import './stringified.html'

highlight.registerLanguage('json', jsonLang)

Template.stringified.helpers({
  stringify(target) {
    return target && EJSON.stringify(target, { indent: 2 })
  },
})

Template.stringified.onRendered(() => {
  document.querySelectorAll('pre code').forEach((block) => {
    highlight.highlightBlock(block)
  })
})
