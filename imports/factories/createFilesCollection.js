import { createGridFilesFactory } from 'meteor/leaonline:grid-factory'
import { i18n } from '../api/i18n/i18n'

const i18nFactory = i18n.get

export const createFilesCollection = createGridFilesFactory({ i18nFactory })
