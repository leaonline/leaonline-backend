import { Template } from 'meteor/templating'
import { Schema } from '../../../api/schema/Schema'
import { Users } from '../../../api/accounts/Users'
import { loggedIn } from '../../../utils/accounts'
import { Router } from '../../../api/routes/Router'
import { errorToObject } from '../../../utils/errorToObject'
import dely from 'dely'
import './login.html'

const by300 = dely(300)
const loginSchema = Schema.create(Users.login.schema)

const states = {
  login: 'login',
  loggedIn: 'loggedIn',
}

Template.login.onCreated(function () {
  this.autorun(() => {
    const view = this.state.get('view')
    if (loggedIn()) {
      return this.state.set('view', states.loggedIn)
    }
    if (!view) {
      this.state.set('view', states.login)
    }
  })
})

Template.login.helpers({
  loginError() {
    return Template.getState('loginError')
  },
  view(name) {
    return Template.getState('view') === name
  },
  loggedIn() {
    const instance = Template.instance()
    return (
      instance.state.get('view') === states.loggedIn &&
      !instance.state.get('loggingIn')
    )
  },
  loggingIn() {
    return Template.getState('loggingIn')
  },
  loginSchema() {
    return loginSchema
  },
})

Template.login.events({
  'click .login-button'(event, templateInstance) {
    event.preventDefault()

    templateInstance.state.set({ loggingIn: true, loginError: null })
    Users.login.call(
      by300((err) => {
        templateInstance.state.set('loggingIn', false)
        if (err) {
          console.error(err)
          let loginError = err
          if (err.errorType === 'Accounts.LoginCancelledError') {
            loginError = new Meteor.Error(400, 'pages.login.cancelled')
          }
          if (err.message === 'Login service configuration not yet loaded') {
            loginError = new Meteor.Error(400, 'pages.login.waitForConfig')
          }

          return templateInstance.state.set(
            'loginError',
            errorToObject(loginError),
          )
        }

        templateInstance.state.set('loginError', null)
        const route = templateInstance.data.next()
        Router.go(route)
      }),
    )
  },
})
