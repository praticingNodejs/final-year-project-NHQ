// Initializes the `role` service on path `/role`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/professional-roles.model'
import hooks from './professional-roles.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/professional-roles', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('professional-roles')

    service.hooks(hooks)
}
