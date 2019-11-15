export const once = fct => {
  let executed = false
  let result
  return (...args) => {
    if (executed) return result
    result = fct(...args)
    executed = true
  }
}
