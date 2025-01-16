import { resolveFieldFromCollection } from '../../../config/fields/resolveFieldFromCollection'
import { resolveFieldFromContext } from '../../../config/fields/resolveFieldFromContext'

export const csvExporter = ({ schema, data, separator = ';', newline = '\n', fieldConfig }) => {
  const header = []
  const metas = []

  Object.keys(metaSchema).forEach(key => {
    // todo add resolver function
    metas.push({ key })
  })
  Object.keys(schema).forEach(key => {
    let resolve
    if (schema[key].dependency) {
      const collectionName = schema[key].dependency.collection
      if (collectionName && fieldConfig[collectionName]) {
        resolve = (docId) => {
          const { doc } = resolveFieldFromCollection({
            value: docId,
            fieldConfig: fieldConfig[collectionName],
            isArray: schema[key].type === Array
          })
          const { value, label } = doc
          return label ?? value
        }
      }

      const contextName = schema[key].dependency.context
      if (contextName) {
        resolve = (value) => {
          const result = resolveFieldFromContext({ value, fieldConfig: fieldConfig[contextName] })
          return result?.name ? result.name : value
        }
      }
    }
    header.push({ key, resolve })
  })

  const mapFn = (doc, isMeta) => ({ key, resolve }) => {
    let value = (isMeta && doc.meta)
      ? doc.meta[key]
      : doc[key]

    if (resolve) {
      value = resolve(value, key)
    }

    const type = typeof value

    if (type === 'string') {
      value = `"${value.replaceAll('"', '\'')}"`
    }

    if (type === 'object' && value !== null) {
      value = value.toString()
    }

    if (type === 'undefined' || value === null) {
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
      .concat(metas.map(mapFn(doc, true)))
      .concat(header.map(mapFn(doc, false)))
    out += line(values)
  })

  return out
}

const resolveDate = v => v && new Date(v).toLocaleString()
const resolveUser = id => id
const metaSchema = {
  createdAt: { resolve: resolveDate },
  updatedAt: { resolve: resolveDate },
  createdBy: { resolve: resolveUser },
  updatedBy: { resolve: resolveUser }
}
