import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, setNow, disallow } from 'feathers-hooks-common'
import * as apiHook from '../../../../hooks'

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'))],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [
            apiHook.validateEmptyField(['jobsResumeId']),
            apiHook.findRms(),
            apiHook.findJobResume(),
            setNow('sentAt'),
            async context => {
                if (context.params.jobsResume.job.isAnonymousEmployer) {
                    context.data.website = null
                }
                return context
            }
        ],
        update: [disallow('external')],
        patch: [],
        remove: []
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [apiHook.sendEmailConsentNotification()],
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
