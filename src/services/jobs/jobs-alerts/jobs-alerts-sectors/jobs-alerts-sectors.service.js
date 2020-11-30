// Initializes the `jobs-alerts-sectors` service on path `/jobs/alerts/sectors`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/jobs/jobs-alerts/jobs-alerts-sectors.model'
import hooks from './jobs-alerts-sectors.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/alerts/sectors', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/alerts/sectors')

    service.hooks(hooks)
}
