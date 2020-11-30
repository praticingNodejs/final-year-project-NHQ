// Initializes the `sgp-residential-status` service on path `/sgp-residential-status`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/sgp-residential-status.model'
import hooks from './sgp-residential-status.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/sgp-residential-status', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('sgp-residential-status')

    service.hooks(hooks)
}
