// Initializes the `jobs resume visitor` service on path `/jobs/resume/visitor`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/jobs/jobs-resume/jobs-resume-visitor.model'
import hooks from './jobs-resume-visitor.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['patch', 'remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/resume/visitor', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/resume/visitor')

    service.hooks(hooks)
}
