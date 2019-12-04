import { Template } from 'meteor/templating'
import highlight from 'highlight.js/lib/highlight';
import jsonLang from 'highlight.js/lib/languages/json';
import 'highlight.js/styles/github.css';
import './stringified.html'

highlight.registerLanguage('json', jsonLang);

Template.stringified.helpers({
  stringify (target) {
    return target && JSON.stringify(target, null, 2)
  }
})

Template.stringified.onRendered(function () {
  document.querySelectorAll('pre code').forEach((block) => {
    highlight.highlightBlock(block);
  });
})