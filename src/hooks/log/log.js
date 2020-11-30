// A hook that logs service method before, after and error
// See https://github.com/winstonjs/winston for documentation
// about the logger.
import logger from '../../logger'
import util from 'util'

// To see more detailed messages, uncomment the following line:
// logger.level = 'debug'

export const log = () => {
    return context => {
        // This debugs the service call and a stringified version of the hook context
        // You can customize the message (and logger) to your needs
        logger.debug(`${context.type} app.service('${context.path}').${context.method}()`)

        if (typeof context.toJSON === 'function' && logger.level === 'debug') {
            logger.debug('Hook Context', util.inspect(context, { colors: false }))
        }

        if (context.error && !context.result) {
            logger.error(context.error.stack)
        }

        if (context.params && context.params.headers) {
            let authorize = context.params.headers.authorization
            if (authorize) {
                let index = authorize.indexOf('Token ')
                if (index != -1) {
                    context.params.headers.authorization = authorize.slice(6)
                }
            }
        }
        return context
    }
}
