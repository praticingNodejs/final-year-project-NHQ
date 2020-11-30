import { disallow } from 'feathers-hooks-common'

export default {
    before: {
        all: [disallow('external')],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [async context => {
            let data = {
                fromUser: context.data.from,
                toUser: Array.isArray(context.data.to) ? context.data.to.join(',') : context.data.to,
                bcc: context.data.bcc && context.data.bcc.length > 0 ? context.data.bcc.join(',') : null,
                subject: context.data.subject,
                content: context.data.html,
                status: 'success',
                sentCount: 1
            }
            context.app.service('mail-logs').create(data)
        }],
        update: [],
        patch: [],
        remove: []
    },

    error: {
        all: [],
        find: [],
        get: [],
        create: [async context => {
            let data = {
                fromUser: context.data.from,
                toUser: Array.isArray(context.data.to) ? context.data.to.join(',') : context.data.to,
                bcc: context.data.bcc && context.data.bcc.length > 0 ? context.data.bcc.join(',') : null,
                subject: context.data.subject,
                content: context.error.stack,
                status: 'error',
                sentCount: 1
            }
            context.app.service('mail-logs').create(data)
        }],
        update: [],
        patch: [],
        remove: []
    }
}
