
const defaults = {
  summary: {
    name: 'summary',
    label: 'documentRenderers.summary',
    template: 'summary',
    async load () {
      return import('./summary/summary')
    }
  }
}

const rendererMap = new Map(Object.entries(defaults))

export const DocumentRenderers = {
  name: 'documentRenderers',
  label: 'documentRenderers.title',
  get: name => rendererMap.get(name),
  all: () => Array.from(rendererMap.values())
}
