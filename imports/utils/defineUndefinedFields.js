const defaultOptions = { value: null, configurable: true, enumerable: true, writable: true }

/**
 * Scans the destination doc for missing keys and defines them explicitly as properties of value null.
 * @param destination
 * @param source
 * @param value
 * @param configurable
 * @param enumerable
 * @param writable
 */

export const defineUndefinedFields = (destination, source, { value, configurable, enumerable, writable } = {}) => {
  const options = Object.assign({}, { value, configurable, enumerable, writable }, defaultOptions)

  let propertiesDefined = false
  Object.entries(source).forEach(([key, value]) => {
    if (!Object.hasOwnProperty.call(destination, key)) {
      Object.defineProperty(destination, key, options)
      propertiesDefined = true
    }
  })

  if (propertiesDefined) {
    // simple sanity check, whether our props have been defined correctly
    const destinationKeys = Object.keys(destination).sort().toString()
    const sourceKeys = Object.keys(source).sort().toString()
    if(destinationKeys !== sourceKeys) {
      throw new TypeError(`Property mismatch detected destination: ${destinationKeys}, source: ${sourceKeys}`)
    }
  }
}
