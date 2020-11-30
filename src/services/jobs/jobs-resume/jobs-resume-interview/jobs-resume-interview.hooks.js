import { authenticate } from '@feathersjs/authentication'
import {
    iff,
    isProvider,
    //setNow,
    disallow
} from 'feathers-hooks-common'

// import * as apiHook from '../../../../hooks'

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'))],
        find: [],
        get: [],
        create: [
            disallow('external')
            // apiHook.validateEmptyField([
            //     'jobsResumeId', 'interviewMode', 'interviewDate', 'address',
            //     'personName', 'personDesignation', 'personTel',
            //     'docsNeeded'
            // ]),
            // apiHook.checkExistJobResume(),
            // setNow('createdAt')
        ],
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
