import { Meteor } from 'meteor/meteor'
import { TTSEngine } from '../../api/core/TTSEngine'

Meteor.startup(() => {
  TTSEngine.configure({ ttsUrl: Meteor.settings.public.tts.url })
})
