// Initializes the `project/contacts` service on path `/project/contacts`
import createService from 'feathers-sequelize'
import createModel from '../../../models/projects/projects-contacts.model'
import hooks from './projects-contacts.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/projects/contacts', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('projects/contacts')

    service.hooks(hooks)
}
