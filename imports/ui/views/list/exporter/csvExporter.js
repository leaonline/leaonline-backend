export const csvExporter = ({ schema, data, separator = ';', newline = '\n' }) => {
  const header = []
  const metas = []

  Object.keys(metaSchema).forEach(key => {
    // todo add resolver function
    metas.push({ key })
  })
  Object.keys(schema).forEach(key => {
    // todo add resolver function
    header.push({ key })
  })

  const mapFn = doc => ({ key, resolve }) => {
    let value = doc[key]

    if (resolve) {
      value = resolve(value, key)
    }

    const type = typeof value

    if (type === 'object') {
      value = value.toString()
    }

    if (type === 'string') {
      value = `"${value.replaceAll('"', '\'')}"`
    }

    if (type === 'undefined') {
      value = ''
    }

    return value
  }

  const line = list => `${list.join(separator)}${newline}`
  const toKey = obj => obj.key
  let out = line([]
    .concat(metas.map(toKey))
    .concat(header.map(toKey))
  )

  data.forEach(doc => {
    const values = []
      .concat(metas.map(mapFn(doc)))
      .concat(header.map(mapFn(doc)))
    out += line(values)
  })

  return out
}

const resolveDate = v => v && new Date(v).toLocaleString()
const resolveUser = id => id
const metaSchema = {
  createdAt: { resolve: resolveDate  },
  updatedAt: { resolve: resolveDate },
  createdBy: { resolve: resolveUser },
  updatedBy: { resolve: resolveUser },
}
