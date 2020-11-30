import { disallow, setNow } from 'feathers-hooks-common'

export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [disallow('external'), setNow('lastSentAt')],
        update: [disallow('external')],
        patch: [disallow('external')],
        remove: [disallow('external')]
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
    },

    error: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
    }
}
