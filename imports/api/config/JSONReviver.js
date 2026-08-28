export const JSONReviver = {}

const handlers = []

function reviver(key, value) {
  for (let i = 0; i < handlers.length; i++) {
    const fn = handlers[i]
    const revivedValue = fn(key, value)
    if (typeof revivedValue !== 'undefined') {
      return revivedValue
    }
  }

  return value
}

JSONReviver.register = (handlerFn) => {
  handlers.push(handlerFn)
}

JSONReviver.revive = (json) => {
  return JSON.parse(json, reviver)
}

JSONReviver.clear = () => {
  handlers.length = 0
}
