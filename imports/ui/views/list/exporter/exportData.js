import { csvExporter } from './csvExporter'
import { resolveFieldFromCollection } from '../../../config/fields/resolveFieldFromCollection'
import { resolveFieldFromContext } from '../../../config/fields/resolveFieldFromContext'
import { jsonExporter } from './jsonExporter'

export const exportData = ({ data, type, schema, fieldConfig, exporterConfig }) => {
  const exporter = exporters[type]
  if (!exporter) throw new Error(`Exporter for type "${type}" not found.`)

  return exportTo({ data, schema, fieldConfig, exporter, exporterConfig })
}

const exporters = {
  csv: csvExporter,
  json: jsonExporter
}

const exportTo = ({ data, schema, fieldConfig, exporter, exporterConfig }) => {
  const mapping = createMapping({ schema, fieldConfig })
  return exporter({
    data,
    mapping,
    config: exporterConfig
  })
}

const createMapping = ({ schema, fieldConfig }) => {
  const header = []
  const metas = []
  const uniqueKeys = new Set()

  Object.keys(schema).forEach(key => {
    let resolve
    if (schema[key].dependency) {
      const collectionName = schema[key].dependency.collection
      const collectionConfig = fieldConfig[collectionName] ?? fieldConfig[key]
      if (collectionName && collectionConfig) {
        resolve = (docId) => {
          const { doc } = resolveFieldFromCollection({
            value: docId,
            fieldConfig: collectionConfig,
            isArray: schema[key].type === Array
          })
          const { value, label } = doc
          return label ?? value
        }
      }

      const contextName = schema[key].dependency.context
      const contextConfig = fieldConfig[contextName] ?? fieldConfig[key]
      if (contextName && contextConfig) {
        resolve = (value) => {
          const result = resolveFieldFromContext({ value, fieldConfig: contextConfig })
          return result?.name ? result.name : value
        }
      }
    }
    header.push({ key, resolve })
    uniqueKeys.add(key)
  })

  Object.keys(metaSchema).forEach(key => {
    // sometimes meta keys are already covered
    // or overridden by the schema, so we skip
    // to avoid duplicate entrues
    if (uniqueKeys.has(key)) return
    metas.push({ key })
  })

  const mapper = ({ key, doc, resolve }) => {
    const isMeta = doc.meta && (key in doc.meta)
    let value = isMeta
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

  return { header, metas, mapper }
}

const resolveDate = v => v && new Date(v).toLocaleString()
const resolveUser = id => id
const metaSchema = {
  _id: String,
  createdAt: { resolve: resolveDate },
  updatedAt: { resolve: resolveDate },
  createdBy: { resolve: resolveUser },
  updatedBy: { resolve: resolveUser }
}
