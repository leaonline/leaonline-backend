export const cloneObject = (original) => {
  const copy = {}
  Object.entries(original).forEach(([key, value]) => {
    Object.defineProperty(copy, key, {
      value: Object.assign({}, value),
      writable: true,
      enumerable: true,
    })
  })

  return copy
}
