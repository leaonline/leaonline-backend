import { Router } from '../Router'

export const getQueryParam = name => Router.queryParam(name)

export const setQueryParam = obj => Router.queryParam(obj)
