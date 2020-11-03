import { Tracker } from 'meteor/tracker'
import { StateVariables } from './StateVariables'
import { getDependenciesForContext } from './getDependenciesForContext'

const defaultLog = () => {}

export const parsePublications = function parsePublications ({ instance, config, logDebug = defaultLog, onSubscribed, settingsDoc, connection }) {
  const reactiveSub = settingsDoc?.reactiveSub
  const allSubs = {}
  const allPublications = Object.values(config.publications)

  const dependencies = getDependenciesForContext(config)
  dependencies.forEach(dep => {
    if (!dep.isType) {
      Object.values(dep.publications).forEach(depPub => allPublications.push(depPub))
    }
  })

  allPublications.forEach(publication => {
    const { name } = publication
    allSubs[name] = false

    const onStop = function (err) {
      if (err) {
        console.error(name, err)
      }
    }

    const onReady = function () {
      logDebug(name, 'complete')
      allSubs[name] = true
      if (Object.values(allSubs).every(entry => entry === true)) {
        logDebug('all subs complete')
        if (onSubscribed) {
          onSubscribed()
        }
        if (instance) {
          const count = instance.mainCollection.find().count()
          logDebug(instance.mainCollection, instance.mainCollection.find().fetch())
          instance.state.set(StateVariables.documentsCount, count)
          instance.state.set(StateVariables.allSubsComplete, true)
        }
      }
    }

    // we can explicitly prevent reactivity using a settings flag
    if (reactiveSub === false) {
      return connection.subscribe(name, {}, { onStop, onReady })
    }

    const sub = connection.subscribe(name, {}, { onStop })
    Tracker.autorun(() => {
      if (sub.ready()) {
        onReady()
      }
    })
  })
}
