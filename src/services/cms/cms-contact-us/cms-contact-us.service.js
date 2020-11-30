// Initializes the `cms-contact-us` service on path `/cms/contact-us`
import createService from 'feathers-sequelize'
import createModel from '../../../models/cms/cms-contact/cms-contact-us.model'
import hooks from './cms-contact-us.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/cms/contact-us', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('cms/contact-us')

    service.hooks(hooks)
}
