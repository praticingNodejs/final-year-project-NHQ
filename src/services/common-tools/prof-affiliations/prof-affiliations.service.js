// Initializes the `prof-affiliation` service on path `/prof-affiliation`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/prof-affiliations.model'
import hooks from './prof-affiliations.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/prof-affiliations', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('prof-affiliations')

    service.hooks(hooks)
}
