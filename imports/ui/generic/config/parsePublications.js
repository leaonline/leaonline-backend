import { StateVariables } from './StateVariables'

export const parsePublications = function parsePublications ({ instance, config, logDebug, onSubscribed, connection }) {
  const allSubs = {}
  const allPublications = Object.values(config.publications)
  if (config.dependencies) {
    config.dependencies.forEach(dep => {
      if (!dep.isType) {
        Object.values(dep.publications).forEach(depPub => allPublications.push(depPub))
      }
    })
  }

  allPublications.forEach(publication => {
    const { name } = publication
    allSubs[name] = false
    const onStop = function (err) {
      if (err) {
        console.error(name, err)
        if (err.message) {
          alert(err.message)
        }
      }
    }
    const onReady = function () {
      logDebug(name, `complete`)
      allSubs[name] = true
      if (Object.values(allSubs).every(entry => entry === true)) {
        logDebug('all subs complete')
        if (onSubscribed) {
          onSubscribed()
        }
        const count = instance.mainCollection.find().count()
        logDebug(instance.mainCollection, instance.mainCollection.find().fetch())
        instance.state.set(StateVariables.documentsCount, count)
        instance.state.set(StateVariables.allSubsComplete, true)
      }
    }
    connection.subscribe(name, {}, { onStop, onReady })
  })
}