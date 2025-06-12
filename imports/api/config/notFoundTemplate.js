export const notFoundTemplate = () => {
  return {
    name: 'notFound',
    template: 'notFound',
    load: async function () {
      return import('../../ui/pages/notfound/notFound')
    },
  }
}
