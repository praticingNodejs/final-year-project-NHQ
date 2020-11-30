// Application hooks that run for every service
import { log, errorResponse } from './hooks'

export default {
    before: {
        all: [log()],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
    },

    after: {
        all: [log()],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
    },

    error: {
        all: [log(), errorResponse()],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
    }
}
