// Initializes the `expertise` service on path `/expertise`
import createServie from 'feathers-sequelize'
import createModel from '../../../models/common-tools/expertises.model'
import hooks from './expertises.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/expertises', createServie(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('expertises')

    service.hooks(hooks)
}
