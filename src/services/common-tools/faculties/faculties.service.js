// Initializes the `faculty` service on path `/faculty`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/faculties.model'
import hooks from './faculties.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/faculties', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('faculties')

    service.hooks(hooks)
}
