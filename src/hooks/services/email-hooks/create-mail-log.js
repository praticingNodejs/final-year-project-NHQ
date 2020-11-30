// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import { GeneralError } from '@feathersjs/errors'

// eslint-disable-next-line no-unused-vars
export const createMailLog = (options = {}) => {
    return async context => {
        const {
            to,
            subject,
            bcc
        } = context.data

        const { error } = context
        const { status } = options

        const mailLog = {
            to: !Array.isArray(to) ? to : to.join(','),
            bcc: !Array.isArray(bcc) ? bcc : bcc.join(','),
            subject,
            error,
            status,
        }

        await context.app.service('mail-logs').create(mailLog)
            .catch(_err => {
                throw new GeneralError('INTERNAL_SERVER_ERROR')
            })

        return context
    }
}
