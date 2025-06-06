import { Meteor } from 'meteor/meteor'
import { TTSEngine } from '../../api/core/TTSEngine'
import { setShuffle } from 'meteor/leaonline:corelib/utils/shuffle'
import { Components } from '../../api/core/Components'
import shuffle from 'fast-shuffle'

setShuffle(shuffle)

Components.autoLoad()
Components.contentPath(Meteor.settings.public.hosts.content.url)

Meteor.startup(() => {
  TTSEngine.configure({
    loader: externalServerTTSLoader,
    mode: TTSEngine.modes.browser
  })
})

function externalServerTTSLoader (requestText, callback) {
  throw new Error('External TTS server is not configured. Please set the TTS URL in the settings.')
}
