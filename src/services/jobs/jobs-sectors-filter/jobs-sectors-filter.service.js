// Initializes the `jobs-sectors-filter` service on path `/jobs-sectors-filter`
import createService from 'feathers-sequelize'
import createModel from '../../../models/jobs/jobs-sectors-filter.model'
import hooks from './jobs-sectors-filter.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['create', 'patch', 'remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/sectors/filter', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/sectors/filter')

    service.hooks(hooks)
}
