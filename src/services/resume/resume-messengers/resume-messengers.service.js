// Initializes the `resume-messengers` service on path `/resume/messengers`
import createService from 'feathers-sequelize'
import createModel from '../../../models/resume/resume-messengers.model'
import hooks from './resume-messengers.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['create', 'patch', 'remove']
    }

    // Initialize our service with any options it requires
    app.use('/resume/messengers', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('resume/messengers')

    service.hooks(hooks)
}
