// Initializes the `companies-disciplines` service on path `/companies/disciplines`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/companies/companies-common-tools/companies-disciplines.model'
import hooks from './companies-disciplines.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch', 'remove']
    }

    // Initialize our service with any options it requires
    app.use('/companies/disciplines', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('companies/disciplines')

    service.hooks(hooks)
}
