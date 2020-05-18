import { ContextRegistry } from './ContextRegistry'
import { JSONReviver } from './JSONReviver'
import { getViewType } from './getViewType'

/**
 * This transforms the config from the app to a more usable structure.
 * At first it revives the stringified schema, because JSON does not support the schema constructors
 * (String, Number etc...) so we use our custom reviver for that.
 * Next we denormalize dependencies because at this stage it is cheap to do so.
 * If we would do this on the template level, the template would have to deal with information
 * it usually not can easily retrieve.
 * @param context the context, received from the registered app
 */

export const parseContext = (context) => {
  context.content = context.content.map(JSONReviver.revive)
  const toContext = name => context.content.find(context => context.name === name)
  context.content.forEach(context => {
    if (!context.type) {
      const viewType = getViewType(context)
      context.type = viewType.name
    }

    if (context.dependencies && context.dependencies.length > 0) {
      context.dependencies = context.dependencies.map(toContext)
    }

    ContextRegistry.add(context.name, context)
  })
}
