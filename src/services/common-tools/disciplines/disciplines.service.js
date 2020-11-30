// Initializes the `discipline` service on path `/discipline`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/disciplines.model'
import hooks from './disciplines.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/disciplines', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('disciplines')

    service.hooks(hooks)
}
