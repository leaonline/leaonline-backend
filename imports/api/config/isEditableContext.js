const pass = (obj) => obj && Object.keys(obj).length > 0

/**
 * A content that is editable on this backend needs to have
 * methods (insert/update), publications (get docs) and optionally routes (http) defined.
 * If none of these are defined, the context is not editable.
 * @param methods methods object
 * @param publications publications object
 * @param routes routes object
 * @return {boolean} true if any of these is defined with at least one entry, otherwise false
 */
export const isEdtableContext = ({ methods, publications, routes }) => {
  if (pass(methods)) return true
  if (pass(publications)) return true
  return !!pass(routes)
}
