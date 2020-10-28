import { Meteor } from 'meteor/meteor'
import { TTSEngine } from '../../api/core/TTSEngine'
import { setShuffle } from 'meteor/leaonline:corelib/utils/shuffle'
import shuffle from 'fast-shuffle'
import { Components } from '../../api/core/Components'

setShuffle(shuffle)

Components.autoLoad()

Meteor.startup(() => {
  TTSEngine.configure({ ttsUrl: Meteor.settings.public.tts.url, mode: TTSEngine.modes.browser })
})
