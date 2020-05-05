import { createFilesCollectionFactory } from 'meteor/leaonline:files-collection-factory'
import { i18n } from '../api/i18n/I18n'

const i18nFactory = i18n.get

export const createFilesCollection = createFilesCollectionFactory({ i18nFactory })
