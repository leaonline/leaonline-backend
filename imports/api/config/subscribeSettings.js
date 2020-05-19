import { ReactiveVar } from 'meteor/reactive-var'
import { Tracker } from 'meteor/tracker'
import { Apps } from '../apps/Apps'

const subscriptions = new ReactiveVar([])
const names = new Set()

Tracker.autorun(() => {
  const allNames = subscriptions.get()
  Apps.subscribe({ names: allNames })
})

export const subscribeSettings = (name) => {
  names.add(name)
  subscriptions.set(Array.from(names))
}
