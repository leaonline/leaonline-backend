import { Mongo } from 'meteor/mongo'

const NotificationsCollection = new Mongo.Collection(null)

/**
 * Client-side notifications manager
 * @client
 */
export const Notifications = {}

Notifications.add = ({
  title,
  type,
  content,
  details,
  visible = true,
  timeout = 2500,
}) => {
  const insertId = NotificationsCollection.insert({
    title,
    type,
    content,
    details,
    visible,
    timeout,
  })
  if (visible && typeof timeout === 'number' && timeout > 0) {
    setTimeout(() => {
      NotificationsCollection.update(insertId, { $set: { visible: false } })
    }, timeout)
  }
  return insertId
}

Notifications.remove = (id) => NotificationsCollection.remove(id)

Notifications.entries = () => NotificationsCollection.find()
