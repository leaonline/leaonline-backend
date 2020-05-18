import { ViewTypes } from './ViewTypes'

const notFoundTemplate = async function () {
  return import('../../ui/pages/notfound/notFound')
}

export const getTemplate = type => {
  if (ViewTypes[type]) {
    return ViewTypes[type]
  }

  return {
    template: 'notFound',
    load: notFoundTemplate
  }
}
