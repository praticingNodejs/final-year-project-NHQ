// Initializes the `system-roles` service on path `/system-roles`
import createService from 'feathers-sequelize'
import createModel from '../../../models/users/system-roles.model'
import hooks from './system-roles.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/system-roles', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('system-roles')

    service.hooks(hooks)
}
