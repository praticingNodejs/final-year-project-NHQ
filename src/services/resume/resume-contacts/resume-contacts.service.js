// Initializes the `resume-contacts` service on path `/resume/contacts`
import createService from 'feathers-sequelize'
import createModel from '../../../models/resume/resume-contacts.model'
import hooks from './resume-contacts.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['create', 'patch', 'remove']
    }

    // Initialize our service with any options it requires
    app.use('/resume/contacts', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('resume/contacts')

    service.hooks(hooks)
}
