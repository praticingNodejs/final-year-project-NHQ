// Initializes the `jobs-resume-notifications` service on path `/jobs/resume/notifications`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/jobs/jobs-resume/jobs-resume-notifications.model'
import hooks from './jobs-resume-notifications.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/resume/notifications', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/resume/notifications')

    service.hooks(hooks)
}
