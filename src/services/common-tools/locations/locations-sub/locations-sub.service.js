// Initializes the `locations-sub` service on path `/locations/sub`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/common-tools/locations-sub.model'
import hooks from './locations-sub.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/locations/sub', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('locations/sub')

    service.hooks(hooks)
}
