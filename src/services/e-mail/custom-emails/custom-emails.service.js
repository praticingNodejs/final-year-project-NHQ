// Initializes the `email-details` service on path `/email-details`
import createService from 'feathers-sequelize'
import createModel from '../../../models/e-mail/custom-emails.model'
import hooks from './custom-emails.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/custom-emails', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('custom-emails')

    service.hooks(hooks)
}
