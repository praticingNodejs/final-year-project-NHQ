import { authenticate } from '@feathersjs/authentication'
import { fastJoin, iff, isProvider, setNow, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'

const jobLaterViewResolvers = {
    joins: {
        job: (..._args) => async (jobLaterView, context) => jobLaterView.job = jobLaterView.jobId ? await context.app.service('jobs').get(jobLaterView.jobId).catch(_e => { return null }) : null
    }
}

export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [
            iff(isProvider('external'), authenticate('jwt'), setNow('createdAt')),
            apiHook.checkJobsLaterView()
        ],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'))],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.multiCRUD())]
    },

    after: {
        all: [fastJoin(jobLaterViewResolvers)],
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
