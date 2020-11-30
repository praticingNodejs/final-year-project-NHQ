import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, fastJoin, setNow, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../../hooks'

const joinJobsResume = {
    joins: {
        jobsResume: (..._args) => async (jobsResumeDocument, context) => jobsResumeDocument.jobsResume = await context.app.service('jobs/resume').get(jobsResumeDocument.jobsResumeId).catch(_e => { return null })
    }
}

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'))],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [setNow('createdAt')],
        update: [disallow('external')],
        patch: [],
        remove: []
    },

    after: {
        all: [iff(isProvider('server'), fastJoin(joinJobsResume))],
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
