// Initializes the `trending-keywords/add` service on path `/trending-keywords/add`
import { Add } from './add.class'
import hooks from './add.hooks'

export default function (app) {
    const options = {
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/trending-keywords/add', new Add(options, app))

    // Get our initialized service so that we can register hooks
    const service = app.service('trending-keywords/add')

    service.hooks(hooks)
}
