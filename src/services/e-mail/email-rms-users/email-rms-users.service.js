// Initializes the `email-rms-users` service on path `/email/rms-users`
import createService from 'feathers-sequelize'
import createModel from '../../../models/e-mail/email-rms-users.model'
import hooks from './email-rms-users.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/email/rms-users', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('email/rms-users')

    service.hooks(hooks)
}
