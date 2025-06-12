export const dataTarget = (event, instance, type) => {
  let t = typeof instance === 'string' ? instance : type
  if (!t) t = 'target'
  const target = event.currentTarget ?? event.target
  if (!target) return
  const key = `data-${t}`
  const value = target.getAttribute(key)
  if (value) return value
  return target.dataset[t]
}
