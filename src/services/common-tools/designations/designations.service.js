// Initializes the `designation` service on path `/designation`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/designations.model'
import hooks from './designations.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch'],
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/designations', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('designations')

    service.hooks(hooks)
}
