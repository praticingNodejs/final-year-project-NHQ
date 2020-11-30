import { authenticate } from '@feathersjs/authentication'
import { setNow, iff, isProvider, disallow } from 'feathers-hooks-common'

import { validateRole } from '../../../hooks'
import CONSTANT from '../../../constant'

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'), validateRole(...CONSTANT.VALIDATE_ROLE_ARMS))],
        find: [],
        get: [],
        create: [
            setNow('createdAt'),
            async context => {
                context.data.text = context.data.text.toLowerCase()
                return context
            }
        ],
        update: [disallow('external')],
        patch: [setNow('updatedAt')],
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
