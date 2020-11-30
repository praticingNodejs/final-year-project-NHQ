import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, setNow, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../../hooks'

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'))],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [
            apiHook.validateEmptyField(['jobsResumeId', 'notification']),
            apiHook.findRms(),
            apiHook.createMailNotification(),
            setNow('createdAt')
        ],
        update: [disallow('external')],
        patch: [],
        remove: []
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [apiHook.createMailNotification()],
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
