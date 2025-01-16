import { csvExporter } from './csvExporter'

export const exportData = ({ data, type, schema, fieldConfig }) => {
  switch (type) {
    case 'csv':
      return csvExporter({ data, type, schema, fieldConfig })
    default:
      throw new Error(`Unknown exporter type ${type}`)
  }
}
