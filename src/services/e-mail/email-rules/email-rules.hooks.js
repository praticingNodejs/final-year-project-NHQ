import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, setNow, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'))],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS)],
        update: [disallow('external')],
        patch: [apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS), setNow('updatedAt')],
        remove: [apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS)]
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
