import { getCollection } from '../../utils/collection'

export const isOptions = (key, value) => {
  if (key === 'options' && !Array.isArray(value)) {
    const optionsProjection = Object.assign({}, value.projection)
    const optonsMapFct = (el) => {
      return {
        value: el[(value.map && value.map.valueSrc) || '_id'],
        label: el[(value.map && value.map.labelSrc) || 'label']
      }
    }

    return function options () {
      const OptionsCollection = getCollection(value.collectionName)
      if (!OptionsCollection) return []
      const optionsQuery = {}
      if (value.query) {
        Object.keys(value.query).forEach(key => {
          const fieldValue = global.AutoForm.getFieldValue(key)
          if (fieldValue) {
            optionsQuery[key] = fieldValue
          }
        })
      }
      return OptionsCollection.find(optionsQuery, optionsProjection).fetch().map(optonsMapFct)
    }
  }
}
