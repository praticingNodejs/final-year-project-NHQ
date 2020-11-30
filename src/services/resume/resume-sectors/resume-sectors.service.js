// Initializes the `resume_sectors` service on path `/resume-sectors`
import createService from 'feathers-sequelize'
import createModel from '../../../models/resume/resume-sectors.model'
import hooks from './resume-sectors.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['create', 'patch', 'remove']
    }

    // Initialize our service with any options it requires
    app.use('/resume/sectors', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('resume/sectors')

    service.hooks(hooks)
}
