import { Meteor } from 'meteor/meteor'
import { TTSEngine } from '../../api/core/TTSEngine'
import { setShuffle } from 'meteor/leaonline:corelib/utils/shuffle'
import shuffle from 'fast-shuffle'

setShuffle(shuffle)

Meteor.startup(() => {
  TTSEngine.configure({ ttsUrl: Meteor.settings.public.tts.url, mode: TTSEngine.modes.browser })
})
