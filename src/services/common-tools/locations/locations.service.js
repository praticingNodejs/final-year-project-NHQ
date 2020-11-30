// Initializes the `location` service on path `/location`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/locations.model'
import hooks from './locations.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/locations', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('locations')

    service.hooks(hooks)
}
