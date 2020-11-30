// Initializes the `rank` service on path `/rank`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/ranks.model'
import hooks from './ranks.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['create', 'patch']
    }

    // Initialize our service with any options it requires
    app.use('/ranks', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('ranks')

    service.hooks(hooks)
}
