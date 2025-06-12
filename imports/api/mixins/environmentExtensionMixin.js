import { createLog } from '../../utils/log'

/**
 * This mixin injects useful generic functions into the method or publication
 * environment (the funciton's this-context).
 *
 * @param options
 * @return {*}
 */
export const environmentExtensionMixin = (options) => {
  const log = createLog(`method:${options.name}`)
  const runFct = options.run

  options.run = async function run(...args) {
    log('run by ', this.userId)
    return runFct.call(this, ...args)
  }

  return options
}
