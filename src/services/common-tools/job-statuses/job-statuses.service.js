// Initializes the `job-status` service on path `/job-status`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/job-statuses.model'
import hooks from './job-statuses.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/job-statuses', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('job-statuses')

    service.hooks(hooks)
}
