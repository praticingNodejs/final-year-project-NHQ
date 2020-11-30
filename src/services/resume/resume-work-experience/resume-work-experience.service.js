/* eslint-disable no-prototype-builtins */
// Initializes the `resume-work-experience` service on path `/resume/work-experience`
import createService from 'feathers-sequelize'
import createModel from '../../../models/resume/resume-work-experience.model'
import hooks from './resume-work-experience.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['create', 'patch', 'remove']
    }

    // Initialize our service with any options it requires
    app.use('/resume/work-experience', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('resume/work-experience')

    service.hooks(hooks)
}
