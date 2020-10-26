import { ContextRegistry } from './ContextRegistry'
import { JSONReviver } from './JSONReviver'
import { getViewType } from './getViewType'

const toContextByName = name => ContextRegistry.get(name)

/**
 * This transforms the config from the app to a more usable structure.
 * At first it revives the stringified schema, because JSON does not support the schema constructors
 * (String, Number etc...) so we use our custom reviver for that.
 *
 * Next we denormalize dependencies because at this stage it is cheap to do so.
 * If we would do this on the template level, the template would have to deal with information
 * it usually not can easily retrieve.
 *
 * @param name the name of the registered app
 * @param application the context, received from the registered app
 */

export const parseContext = (name, application) => {
  const content = application.content.map(JSONReviver.revive)

  // round 1 - parse and register

  content.forEach(context => {
    if (!context.viewType) {
      context.viewType = getViewType(name, context)
    }

    ContextRegistry.add(context.name, context)
  })

  // round 2 - map dependencies

  content.forEach(context => {
    if (context.dependencies && context.dependencies.length > 0) {
      context.dependencies = context.dependencies.map(toContextByName)
    }
  })

  // reassign for later use
  application.content = content

  return application
}
