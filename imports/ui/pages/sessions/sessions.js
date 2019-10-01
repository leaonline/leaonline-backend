import { Apps } from '../../../api/apps/Apps'
import './sessions.html'

const { sessions } = Meteor.settings.public.pages
const connection = Apps.connect(sessions.use)

Template.sessions.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    if (connection.status().status !== 'connected') {
      instance.state.set('notConnected', true)
      return
    } else {
      instance.state.set('notConnected', false)
    }

    connection.call('user.methods.recent', (err, recentSessions) => {
      if (err) {
        instance.state.set('err', err)
      } else {
        instance.state.set('recentSessions', recentSessions)
      }
      setTimeout(() => {
        instance.state.set('sessionsLoaded', true)
      }, 150)

    })
  })
})

Template.sessions.helpers({
  err () {
    return Template.getState('err')
  },
  notConnected () {
    return Template.getState('notConnected')
  },
  sessionsLoaded () {
    return Template.getState('sessionsLoaded')
  },
  sessions () {
    return Template.getState('recentSessions')
  }
})
