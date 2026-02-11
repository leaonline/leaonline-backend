module.exports = (SimpleSchema, settings) => {
  const schema = def => new SimpleSchema(def)
  const urlField = {
    type: String,
    regEx: SimpleSchema.RegEx.url,
  }

  const remoteApp = {
    label: String,
    name: String,
    url: urlField,
    icon: String,
    ddpConnect: Boolean,
    ddpLogin: Boolean,
    jwt: {
      type: Object,
      optional: true
    },
    'jwt.key': String,
    'jwt.sub': String,
  }

  const settingsSchema = schema({
    oauth: schema({
      clientId: String,
      secret: String,
      dialogUrl: urlField,
      accessTokenUrl: urlField,
      authorizeUrl: urlField,
      identityUrl: urlField,
      redirectUrl: urlField,
    }),
    public: schema({
      app: schema({
        title: String,
        version: String,
      }),
      editor: schema({
        textAreaThreshold: SimpleSchema.Integer,
      }),
      hosts: schema({
        otulea: schema(remoteApp),
        content: schema(remoteApp),
        teacher: schema(remoteApp),
        app: schema(remoteApp),
      }),
      tts: schema({
        url: urlField,
      }),
      pages: schema({
        sessions: schema({
          use: String,
        }),
      }),
    }),
  })
  settingsSchema.validate(settings)
}
