// Initializes the `skills` service on path `/skills`
import createService from 'feathers-sequelize'
import createModel from '../../../models/jobs/jobs-skills.model'
import hooks from './jobs-skills.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['patch', 'remove']
    }

    // Initialize our service with any options it requires
    app.use('/jobs/skills', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/skills')

    service.hooks(hooks)
}
