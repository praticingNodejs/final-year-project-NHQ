// Initializes the `jobs-coowners` service on path `/jobs/coowners`

import createService from 'feathers-sequelize'
import createModel from '../../../models/jobs/jobs-coowners.model'
import hooks from './jobs-coowners.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/coowners', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/coowners')

    service.hooks(hooks)
}
