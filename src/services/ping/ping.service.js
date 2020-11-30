// Initializes the `ping` service on path `/ping`
import { Ping } from './ping.class'
import hooks from './ping.hooks'

export default function (app) {
    const options = {
        paginate: app.get('paginate')
    }

    // Initialize our service with any options it requires
    app.use('/ping', new Ping(options, app))

    // Get our initialized service so that we can register hooks
    const service = app.service('ping')

    service.hooks(hooks)
}
