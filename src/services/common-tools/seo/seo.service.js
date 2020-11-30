// Initializes the `seo` service on path `/seo`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/seo.model'
import hooks from './seo.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['patch']
    }

    // Initialize our service with any options it requires
    app.use('/seo', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('seo')

    service.hooks(hooks)
}
