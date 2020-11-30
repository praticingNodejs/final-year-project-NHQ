// Initializes the `sector-mapping` service on path `/sector-mapping`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/sector-mappings.model'
import hooks from './sector-mappings.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/sector-mappings', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('sector-mappings')

    service.hooks(hooks)
}
