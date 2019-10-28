import { Dimensions } from 'meteor/leaonline:interfaces/Dimensions'
import { Levels } from 'meteor/leaonline:interfaces/Levels'
import { ContextRegistry } from '../../../api/ContextRegistry'

ContextRegistry.add(Dimensions.name, Dimensions)
ContextRegistry.add(Levels.name, Levels)
