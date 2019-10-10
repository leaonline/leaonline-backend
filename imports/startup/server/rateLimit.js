import { runRateLimiter } from '../../factories/rateLimit'

runRateLimiter(function callback (reply, input) {
  if (reply.allowed) {
    return
  } else {
    console.log('rate limit exceeded')
    console.log(reply)
    console.log(input)
  }
})
