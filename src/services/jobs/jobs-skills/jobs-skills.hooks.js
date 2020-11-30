import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

export default {
    before: {
        all: [],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.multiCRUD()),
            apiHook.validateEmptyField(['jobId', 'name']),
        ],
        update: [disallow('external')],
        patch: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.multiCRUD()),
        ],
        remove: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.multiCRUD())
        ]
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
