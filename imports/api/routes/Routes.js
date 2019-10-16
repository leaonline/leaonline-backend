import { createLoggedinTrigger, createLoginTrigger, createNotFoundTrigger } from './triggers'
import settings from '../../../resources/i18n/i18n_routes'

export const Routes = {}

/**
 * Renders a default template for all pages that have not been found.
 */

Routes.notFound = {
  path: () => `/${settings.notFound}`,
  label: 'pages.notFound.title',
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/notfound/notFound')
  },
  target: null,
  template: 'notFound',
  roles: null,
  data: {
    next () {
      return Routes.overview
    }
  }
}

/**
 * Dashboard landing page post login
 */

Routes.dashboard = {
  path: () => `/${settings.dashboard}`,
  label: 'pages.dashboard.title',
  triggersEnter: () => [
    createLoginTrigger(Routes.login)
  ],
  async load () {
    return import('../../ui/pages/dashboard/dashboard')
  },
  target: null,
  template: 'dashboard',
  roles: null,
  data: null,
  icon: 'home'
}

/**
 * Login form page
 */

Routes.login = {
  path: () => `/${settings.login}`,
  label: 'pages.login.title',
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/login/login')
  },
  target: 'login-render-target',
  template: 'login',
  roles: null,
  data: {
    next () {
      return Routes.dashboard
    }
  }
}

/**
 * The default route to be used when landing on the page without params
 *
 */

Routes.root = {
  path: () => '/',
  label: 'pages.redirecting.title',
  triggersEnter: () => [
    createLoginTrigger(Routes.login),
    createLoggedinTrigger(Routes.dashboard)
  ],
  async load () {
    return true
  },
  target: null,
  template: 'loading',
  roles: null,
  data: null
}

/**
 * Displays status overview for all apps.
 */

Routes.statusOverview = {
  path: () => `/${settings.status}`,
  label: 'pages.status.overview',
  triggersEnter: () => [
    createLoginTrigger(Routes.login),
  ],
  async load () {
    return import('../../ui/pages/status/overview')
  },
  target: null,
  template: 'statusOverview',
  roles: null,
  data: {
    next (appId) {

    }
  },
  icon: 'heartbeat'
}

Routes.fallback = {
  path: () => '*',
  label: 'pages.redirecting.title',
  triggersEnter: () => [
    createNotFoundTrigger(Routes.notFound)
  ],
  async load () {
    return true
  },
  target: null,
  template: 'loading',
  roles: null,
  data: null
}

Object.keys(Routes).forEach(key => {
  Routes[ key ].key = key
})
