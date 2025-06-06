export const jsonExporter = ({ data, mapping }) => {
  const { metas, header, mapper } = mapping
  const keys = [].concat(metas).concat(header)

  const mapped = data.map(doc => {
    const copy = {}
    keys.forEach(({ key, resolve }) => {
      copy[key] = mapper({ key, resolve, doc })
    })
    return copy
  })

  return JSON.stringify(mapped, null, 0)
}
