import { Users } from '../../../api/accounts/Users'
import { i18n } from '../../../api/i18n/i18n'

Users.inject.i18n(i18n.get)
