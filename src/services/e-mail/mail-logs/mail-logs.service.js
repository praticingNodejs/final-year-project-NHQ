// Initializes the `/mail-logs` service on path `/mail-logs`
import createService from 'feathers-sequelize'
import createModel from '../../../models/e-mail/mail-logs.model'
import hooks from './mail-logs.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/mail-logs', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('mail-logs')

    service.hooks(hooks)
}
