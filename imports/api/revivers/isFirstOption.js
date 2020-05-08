export const isFirstOptions = (key, value) => {
  if (key === 'firstOptions') {
    return () => value
  }
}
