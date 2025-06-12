import { Notifications } from '../ui/components/notify/Notifications'

/**
 * Creates a default notification response for most known err/res callback types.
 * If the callback contains an error, it will spawn an error notification.
 * If the callback contains no error, but a result, it will spawn a success notification.
 * If neither is true, it will spawn a warning notificaiton.
 * The method optionally allows to execute a follow-up callback, based on the internal err/res state.
 * @param err optional Error instance
 * @param res optional an non-undefined
 * @return {{success: success, error: error, warning: warning}}
 */

export const defaultNotifications = (err, res) => {
  if (err) {
    Notifications.add({
      title: err.error || err.name,
      type: 'danger',
      content: err.reason || err.message,
      details: err.details,
      timeout: 0,
    })
  } else if (typeof res === 'undefined') {
    Notifications.add({
      title: 'notify.noResultTitle',
      type: 'warning',
      content: 'notify.noResultDescription',
    })
  } else {
    Notifications.add({
      title: 'notify.success',
      type: 'success',
      timeout: 800,
    })
  }

  return {
    success: function (cb) {
      if (!cb || err || !res) return
      cb(res)
    },
    error: function (cb) {
      if (!cb || !err) return
      cb(err)
    },
    warning: function (cb) {
      if (!cb || err || res) return
      cb(err, res)
    },
  }
}
