import { safeStringify } from '../../utils/safeStringify'

export class MutationChecker {
  constructor(target, name) {
    this.original = safeStringify(target, null, 0)
    this.name = name
  }

  compare(any, where) {
    const str = safeStringify(any)
    if (this.original !== str) {
      throw new Error(`[${this.name}]: ${where} => mutation detected`)
    }
  }
}
