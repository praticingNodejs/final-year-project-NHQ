import { disallow } from 'feathers-hooks-common'

export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [disallow('external')],
        patch: [],
        remove: []
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
