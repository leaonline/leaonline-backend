import { TaskRenderers } from 'meteor/leaonline:ui/renderers/Renderers'
import { DocumentRenderers } from '../../ui/renderers/DocumentRenderers'
export { RendererGroups } from 'meteor/leaonline:ui/renderers/RendererGroups'

DocumentRenderers.all().forEach((renderer) =>
  TaskRenderers.registerRenderer({
    name: renderer.name,
    label: renderer.label,
    group: TaskRenderers.groups.documents.name,
    template: renderer.template,
    load: renderer.load,
  }),
)

export { TaskRenderers }
