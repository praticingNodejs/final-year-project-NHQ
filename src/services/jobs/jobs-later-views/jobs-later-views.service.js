// Initializes the `jobs-views` service on path `/jobs-views`

import createService from 'feathers-sequelize'
import createModel from '../../../models/jobs/jobs-later-views.model'
import hooks from './jobs-later-views.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs-later-views', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs-later-views')

    service.hooks(hooks)
}
