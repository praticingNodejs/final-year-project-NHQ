// Initializes the `jobs-education` service on path `/jobs/education`
import createService from 'feathers-sequelize'
import createModel from '../../../models/jobs/jobs-educations.model'
import hooks from './jobs-educations.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/educations', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/educations')

    service.hooks(hooks)
}
