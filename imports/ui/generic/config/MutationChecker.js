export class MutationChecker {
  constructor (target, name) {
    this.original = JSON.stringify(target, null, 0)
    this.name = name
  }

  compare (any, where) {
    const str = JSON.stringify(any, null, 0)
    if (this.original !== str) {
      throw new Error(`[${name}]: ${where} => mutation detected`)
    }
  }
}
