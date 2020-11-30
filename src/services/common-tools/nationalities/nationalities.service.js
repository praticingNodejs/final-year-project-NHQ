// Initializes the `nationality` service on path `/nationality`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/nationalities.model'
import hooks from './nationalities.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/nationalities', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('nationalities')

    service.hooks(hooks)
}
