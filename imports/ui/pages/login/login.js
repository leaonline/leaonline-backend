import { Schema } from '../../../api/schema/Schema'
import { Users } from '../../../api/accounts/Users'
import { loggedIn } from '../../../utils/accounts'
import { formIsValid } from '../../../utils/form'
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
  loggingIn () {
    return Template.getState('loggingIn')
  },
  loginSchema () {
    return loginSchema
  }
})

Template.login.events({
  'submit #loginForm' (event, templateInstance) {
    event.preventDefault()
    const insertDoc = formIsValid('loginForm', loginSchema)
    if (!insertDoc) return

    templateInstance.state.set('loggingIn', true)
    Users.login.call(insertDoc.username, insertDoc.password, by300((err, res) => {
      templateInstance.state.set('loggingIn', false)
      if (err) {
        return templateInstance.state.set('loginError', err)
      } else {
        // TODO redirect
      }
    }))
  }
})