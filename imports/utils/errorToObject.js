export const errorToObject = (err) => {
  const obj = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
  if (obj && err.details) {
    Object.assign(obj.details, err.details)
  }
  return obj
}
