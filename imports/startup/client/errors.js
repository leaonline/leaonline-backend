import { BlazeExceptions } from 'meteor/leaonline:blaze-exceptions'

BlazeExceptions.register({
  handler: (data) => {
    console.debug(data)
  },
})
