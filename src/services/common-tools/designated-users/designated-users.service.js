// Initializes the `designated-user` service on path `/designated-user`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/designated-users.model'
import hooks from './designated-users.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/designated-users', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('designated-users')

    service.hooks(hooks)
}
