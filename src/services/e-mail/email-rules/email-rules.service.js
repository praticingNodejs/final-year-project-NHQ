// Initializes the `email-rules` service on path `/email/rules`
import createService from 'feathers-sequelize'
import createModel from '../../../models/e-mail/email-rules.model'
import hooks from './email-rules.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/email/rules', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('email/rules')

    service.hooks(hooks)
}
