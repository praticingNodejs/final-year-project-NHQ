// Initializes the `jobs-resume-remarks` service on path `/jobs/resume/remarks`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/jobs/jobs-resume/jobs-resume-remarks.model'
import hooks from './jobs-resume-remarks.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }
    // Initialize our service with any options it requires
    app.use('/jobs/resume/remarks', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/resume/remarks')

    service.hooks(hooks)
}
