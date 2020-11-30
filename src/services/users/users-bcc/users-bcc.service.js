// Initializes the `users-bcc` service on path `/users-bcc`
import createService from 'feathers-sequelize'
import createModel from '../../../models/users/users-bcc.model'
import hooks from './users-bcc.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/users/bcc', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('users/bcc')

    service.hooks(hooks)
}
