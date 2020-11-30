// Initializes the `cms/cms-contact-us/cms-contact-detail` service on path `/cms/contact-detail`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/cms/cms-contact/cms-contact-detail.model'
import hooks from './cms-contact-detail.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/cms/contact-detail', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('cms/contact-detail')

    service.hooks(hooks)
}
