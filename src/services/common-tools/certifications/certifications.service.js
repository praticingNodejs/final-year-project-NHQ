// Initializes the `certification` service on path `/certification`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/certifications.model'
import hooks from './certifications.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/certifications', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('certifications')

    service.hooks(hooks)
}
