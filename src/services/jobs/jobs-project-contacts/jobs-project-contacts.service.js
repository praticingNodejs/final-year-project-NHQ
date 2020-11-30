// Initializes the `jobs-project-contacts` service on path `/jobs/project-contacts`
import createService from 'feathers-sequelize'
import createModel from '../../../models/jobs/jobs-project-contacts.model'
import hooks from './jobs-project-contacts.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['create', 'remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/project-contacts', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/project-contacts')

    service.hooks(hooks)
}
