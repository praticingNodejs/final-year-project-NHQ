import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'), apiHook.multiCRUD())],
        find: [],
        get: [],
        create: [apiHook.validateEmptyField(['resumeId', 'messengerType', 'messengerAccount'])],
        update: [disallow('external')],
        patch: [],
        remove: [iff(isProvider('external'), apiHook.autoPatchCloneResumeService())]
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [iff(isProvider('external'), apiHook.autoPatchCloneResumeService())],
        update: [],
        patch: [iff(isProvider('external'), apiHook.autoPatchCloneResumeService())],
        remove: [iff(isProvider('external'), apiHook.autoPatchCloneResumeService())]
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
