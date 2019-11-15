import { MediaLib } from 'meteor/leaonline:interfaces/MediaLib'
import { getCollection } from '../../../utils/collection'
import { Apps } from '../../apps/Apps'

let _mediaLibColelction
MediaLib.collection = function () {
  if (!_mediaLibColelction) {
    _mediaLibColelction = getCollection(MediaLib)
  }
  return _mediaLibColelction
}

MediaLib.connection = function () {
  const app = Apps.get(MediaLib.appId)
  return app && app.connection
}

MediaLib.publications.all.subscribe = function () {
  const app = Apps.get(MediaLib.appId)
  if (!app.connection.status().connected || !app.connection.userId()) return { ready () { return false } }
  return app.connection.subscribe(MediaLib.publications.all.name)
}

MediaLib.upload = {}

MediaLib.upload.schema = {
  file: {
    type: String,
    autoform: {
      type: 'fileUpload',
      collection: MediaLib.name
    }
  }
}

export { MediaLib }
