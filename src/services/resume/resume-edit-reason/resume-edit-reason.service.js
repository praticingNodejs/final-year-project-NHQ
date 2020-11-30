// Initializes the `resume-edit-reason` service on path `/resume/edit-reason`
import createService from 'feathers-sequelize'
import createModel from '../../../models/resume/resume-edit-reason.model'
import hooks from './resume-edit-reason.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/resume/edit-reason', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('resume/edit-reason')

    service.hooks(hooks)
}
