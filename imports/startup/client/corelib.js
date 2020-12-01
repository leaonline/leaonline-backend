import { Meteor } from 'meteor/meteor'
import { TTSEngine } from '../../api/core/TTSEngine'
import { setShuffle } from 'meteor/leaonline:corelib/utils/shuffle'
import { Components } from '../../api/core/Components'
import { HTTP } from 'meteor/jkuester:http'
import shuffle from 'fast-shuffle'

setShuffle(shuffle)

Components.autoLoad()

Meteor.startup(() => {
  TTSEngine.configure({
    loader: externalServerTTSLoader,
    mode: TTSEngine.modes.browser
  })
})

function externalServerTTSLoader (requestText, callback) {
  const url = Meteor.settings.public.tts.url
  const options = {
    params: { text: requestText },
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  }

  HTTP.post(url, options, (err, res) => {
    if (err) {
      return callback(err)
    }

    callback(undefined, res?.data?.url)
  })
}
