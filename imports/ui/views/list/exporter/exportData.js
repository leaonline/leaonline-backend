import { csvExporter } from './csvExporter'

export const exportData = ({ data, type, schema }) => {
  switch (type) {
    case 'csv':
      return csvExporter({ data, type, schema })
    default:
      throw new Error(`Unknown exporter type ${type}`)
  }
}
