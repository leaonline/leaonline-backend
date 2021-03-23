import { runRateLimiter } from '../../factories/rateLimit'

runRateLimiter(function callback (reply, input) {
  if (!reply.allowed) {
    console.log('rate limit exceeded')
    console.log(reply)
    console.log(input)
  }
})
