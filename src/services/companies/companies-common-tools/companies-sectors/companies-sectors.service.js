// Initializes the `companies/sectors` service on path `/companies/sectors`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/companies/companies-common-tools/companies-sectors.model'
import hooks from './companies-sectors.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/companies/sectors', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('companies/sectors')

    service.hooks(hooks)
}
