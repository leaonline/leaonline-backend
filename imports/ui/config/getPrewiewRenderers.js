import { TaskRenderers } from '../../api/task/TaskRenderers'
import { i18n } from '../../api/i18n/i18n'

const toOption = (renderer) => ({
  value: renderer.name,
  label: () => i18n.get(renderer.label),
})

export const getPrewiewRenderers = () =>
  TaskRenderers.getGroup(TaskRenderers.groups.documents.name).map(toOption)
