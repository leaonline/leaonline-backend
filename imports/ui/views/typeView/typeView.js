import { Template } from 'meteor/templating'
import '../../components/stringified/stringified'
import './typeView.html'

Template.typeView.onCreated(function () {
  const instance = this
  instance.autorun(() => {
    instance.state.set({ loadComplete: false })
    const data = Template.currentData()
    instance.config = data.config()
    setTimeout(() => instance.state.set({ loadComplete: true }), 300)
  })
})

Template.typeView.helpers({
  loadComplete() {
    return Template.instance().state.get('loadComplete')
  },
  config() {
    return Template.instance().config
  },
  types() {
    const config = Template.instance().config
    return config && Object.values(config.types)
  },
  label(name) {
    const config = Template.instance().config
    const type = config && config.types[name]
    return type && type.label()
  },
})
