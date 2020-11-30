// Initializes the `education` service on path `/education`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/educations.model'
import hooks from './educations.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/educations', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('educations')

    service.hooks(hooks)
}
