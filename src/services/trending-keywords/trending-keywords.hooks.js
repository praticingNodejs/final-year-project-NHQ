import { authenticate } from '@feathersjs/authentication'
import { setNow, iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../hooks'
import CONSTANT from '../../constant'

export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS)), setNow('createdAt')],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS)), setNow('updatedAt')],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS))]
    },

    after: {
        all: [],
        find: [apiHook.checkTrendingKeyWord()],
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
