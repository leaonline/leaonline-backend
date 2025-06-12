export const notFoundTemplate = () => {
  return {
    name: 'notFound',
    template: 'notFound',
    load: async () => import('../../ui/pages/notfound/notFound'),
  }
}
