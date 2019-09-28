import './login.html'
import { Schema } from '../../../api/schema/Schema'
import { Users } from '../../../api/accounts/Users'

const loginSchema = Schema.create(Users.login.schema)

Template.login.helpers({
  loginSchema () {
    return loginSchema
  }
})