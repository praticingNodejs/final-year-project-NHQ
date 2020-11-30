// Initializes the `trending-keywords` service on path `/trending-keywords`
import createService from 'feathers-sequelize'
import createModel from '../../models/trending-keywords/trending-keywords.model'
import hooks from './trending-keywords.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/trending-keywords', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('trending-keywords')

    service.hooks(hooks)
}
