// Initializes the `users-system-roles` service on path `/users/system-roles`
import createService from 'feathers-sequelize'
import createModel from '../../../models/users/users-system-roles.model'
import hooks from './users-system-roles.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/users/system-roles', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('users/system-roles')

    service.hooks(hooks)
}
