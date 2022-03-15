import { Template } from 'meteor/templating'
import { EJSON } from 'meteor/ejson'
import { Schema } from '../../../api/schema/Schema'
import { Users } from '../../../api/accounts/Users'
import { loggedIn } from '../../../utils/accounts'
import { Router } from '../../../api/routes/Router'
import dely from 'dely'
import './login.html'

const by300 = dely(300)
const loginSchema = Schema.create(Users.login.schema)

const states = {
  login: 'login',
  loggedIn: 'loggedIn'
}

Template.login.onCreated(function () {
  const instance = this
  instance.autorun(() => {
    const view = instance.state.get('view')
    if (loggedIn()) {
      return instance.state.set('view', states.loggedIn)
    }
    if (!view) {
      instance.state.set('view', states.login)
    }
  })
})

Template.login.helpers({
  loginError () {
    return Template.getState('loginError')
  },
  view (name) {
    return Template.getState('view') === name
  },
  loggedIn () {
    const instance = Template.instance()
    return instance.state.get('view') === states.loggedIn && !instance.state.get('loggingIn')
  },
  loggingIn () {
    return Template.getState('loggingIn')
  },
  loginSchema () {
    return loginSchema
  }
})

Template.login.events({
  'click .login-button' (event, templateInstance) {
    event.preventDefault()

    templateInstance.state.set('loggingIn', true)
    Users.login.call(by300(err => {
      templateInstance.state.set('loggingIn', false)
      if (err) {
        const code = String(err.error)
        return templateInstance.state.set('loginError', {
          name: code,
          reason: err.reason,
          details: EJSON.stringify(err.details?.data)
        })
      } else {
        const route = templateInstance.data.next()
        Router.go(route)
      }
    }))
  }
})
