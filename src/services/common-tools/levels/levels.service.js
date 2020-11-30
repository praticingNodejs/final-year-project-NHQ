// Initializes the `level` service on path `/level`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/levels.model'
import hooks from './levels.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/levels', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('levels')

    service.hooks(hooks)
}
