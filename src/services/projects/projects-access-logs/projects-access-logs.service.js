// Initializes the `projects-access-logs` service on path `/projects/access-logs`
import createService from 'feathers-sequelize'
import createModel from '../../../models/projects/projects-access-logs.model'
import hooks from './projects-access-logs.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/projects/access-logs', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('projects/access-logs')

    service.hooks(hooks)
}
