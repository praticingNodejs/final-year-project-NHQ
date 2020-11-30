// Initializes the `jobs-credits` service on path `/jobs/credits`
import createService from 'feathers-sequelize'
import createModel from '../../../models/jobs/jobs-credits.model'
import hooks from './jobs-credits.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/credits', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/credits')

    service.hooks(hooks)
}
