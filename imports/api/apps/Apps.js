import { DDP } from 'meteor/ddp-client'

export const Apps = {}

const _apps = {}

Apps.register = function ({ id, name, url }) {
  _apps[ id ] = { id, name, url }
}

Apps.get = function (id) {
  return _apps[id]
}

Apps.connect = function (id) {
  const app = _apps[ id ]
  if (!app.connection) {
    app.connection = DDP.connect(app.url)
  }
  return app.connection
}
