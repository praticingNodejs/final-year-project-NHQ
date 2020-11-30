// Initializes the `software` service on path `/software`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/softwares.model'
import hooks from './softwares.hooks'

export default function (app) {
    const options = {
        Model: createModel(app)
    }

    // Initialize our service with any options it requires
    app.use('/softwares', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('softwares')

    service.hooks(hooks)
}
