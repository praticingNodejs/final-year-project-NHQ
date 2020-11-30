// Initializes the `jobs-alerts-positions` service on path `/jobs/alerts/positions`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/jobs/jobs-alerts/jobs-alerts-positions.model'
import hooks from './jobs-alerts-positions.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/alerts/positions', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/alerts/positions')

    service.hooks(hooks)
}
