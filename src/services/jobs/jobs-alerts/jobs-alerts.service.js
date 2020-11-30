// Initializes the `jobs/alerts` service on path `/jobs/alerts`
import createService from 'feathers-sequelize'
import createModel from '../../../models/jobs/jobs-alerts/jobs-alerts.model'
import hooks from './jobs-alerts.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/alerts', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/alerts')

    service.hooks(hooks)
}
