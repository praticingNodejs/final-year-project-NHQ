// Initializes the `companies/ranks` service on path `/companies/ranks`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/companies/companies-common-tools/companies-ranks.model'
import hooks from './companies-ranks.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch', 'remove']
    }

    // Initialize our service with any options it requires
    app.use('/companies/ranks', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('companies/ranks')

    service.hooks(hooks)
}
