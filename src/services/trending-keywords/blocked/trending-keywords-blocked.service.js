// Initializes the `trending-keywords-blocked` service on path `/trending-keywords/blocked`
import createService from 'feathers-sequelize'
import createModel from '../../../models/trending-keywords/trending-keywords-blocked.model'
import hooks from './trending-keywords-blocked.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
    }

    // Initialize our service with any options it requires
    app.use('/trending-keywords/blocked', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('trending-keywords/blocked')

    service.hooks(hooks)
}
