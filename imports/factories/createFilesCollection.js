import { createFilesCollectionFactory } from 'meteor/leaonline:files-collection-factory'
import { i18n } from '../api/i18n/i18n'

const i18nFactory = i18n.get

export const createFilesCollection = createFilesCollectionFactory({ i18nFactory })
