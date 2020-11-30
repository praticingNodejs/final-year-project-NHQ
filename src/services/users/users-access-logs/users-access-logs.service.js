// Initializes the `users-access-logs` service on path `/users/access-logs`
import createService from 'feathers-sequelize'
import createModel from '../../../models/users/users-access-logs.model'
import hooks from './users-access-logs.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/users/access-logs', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('users/access-logs')

    service.hooks(hooks)
}
