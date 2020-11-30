// Initializes the `jobs-updated-logs` service on path `/jobs-updated-logs`
import createService from 'feathers-sequelize'
import createModel from '../../../models/jobs/jobs-updated-logs.model'
import hooks from './jobs-updated-logs.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/updated-logs', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/updated-logs')

    service.hooks(hooks)
}
