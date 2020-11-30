import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS))],
        find: [],
        get: [],
        create: [disallow('external')],
        update: [disallow('external')],
        patch: [disallow('external')],
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
