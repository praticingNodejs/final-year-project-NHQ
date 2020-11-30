import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, setNow, fastJoin, disallow } from 'feathers-hooks-common'
import * as apiHook from '../../../../hooks'

const internalJoin = {
    joins: {
        consultant: (..._args) => async (jobsResumeRemark, context) => {
            const jobsResume = await context.app.service('jobs/resume').get(jobsResumeRemark.jobsResumeId, {
                query: {
                    $select: ['resumeId', 'consultantId', 'interviewDate', 'status']
                }
            }).catch(_e => { return null })

            const resume = await context.app.service('resume').get(jobsResume.resumeId, {
                query: {
                    $select: ['firstName', 'lastName']
                }
            }).catch(_e => { return null })

            jobsResumeRemark.resume = {
                id: resume?.id,
                firstName: resume?.firstName || null,
                lastName: resume?.lastName || null
            }

            jobsResumeRemark.consultant = {
                firstName: jobsResume.consultant?.firstName || null,
                lastName: jobsResume.consultant?.lastName || null
            }
        }
    }
}

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'))],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [apiHook.validateEmptyField(['jobsResumeId', 'remark']), apiHook.multiCRUD(), setNow('createdAt')],
        update: [disallow('external')],
        patch: [],
        remove: []
    },

    after: {
        all: [],
        find: [fastJoin(internalJoin)],
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
