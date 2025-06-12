export const csvExporter = ({ data, mapping, config = {} }) => {
  const { separator = ';', newline = '\n' } = config
  const { metas, header, mapper } = mapping

  const keys = [].concat(metas).concat(header)
  const line = (list) => `${list.join(separator)}${newline}`
  const toKey = (obj) => obj.key
  let out = line(keys.map(toKey))

  data.forEach((doc) => {
    const values = keys.map(({ key, resolve }) => mapper({ key, doc, resolve }))
    out += line(values)
  })

  return out
}
