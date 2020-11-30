// Initializes the `companies-designations` service on path `/companies/designations`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/companies/companies-common-tools/companies-designations.model'
import hooks from './companies-designations.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch', 'remove']
    }

    // Initialize our service with any options it requires
    app.use('/companies/designations', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('companies/designations')

    service.hooks(hooks)
}
