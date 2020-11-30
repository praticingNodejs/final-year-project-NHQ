// Initializes the `currency` service on path `/currency`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/currencies.model'
import hooks from './currencies.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/currencies', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('currencies')

    service.hooks(hooks)
}
