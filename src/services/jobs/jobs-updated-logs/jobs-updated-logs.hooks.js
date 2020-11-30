import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, fastJoin, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

const populateResolver = {
    joins: {
        newJobStatus: (..._args) => async (jobUpdatedLog, context) => jobUpdatedLog.newJobStatus = jobUpdatedLog.newJobStatusId ? (await context.app.service('job-statuses').findOne({
            query: {
                id: jobUpdatedLog.newJobStatusId,
                $select: ['id', 'name', 'status']
            }
        }).catch(_e => { return null }))?.name : null,
        assignedTo: (..._args) => async (jobUpdatedLog, context) => jobUpdatedLog.assignedTo = jobUpdatedLog.assignedTo ? await context.app.service('rms-users-info').findOne({
            query: {
                userId: jobUpdatedLog.assignedTo,
                $select: ['id', 'firstName', 'lastName']
            }
        }).catch(_e => { return null }) : null,
        updatedBy: (..._args) => async (jobUpdatedLog, context) => jobUpdatedLog.updatedBy = jobUpdatedLog.updatedBy ? await context.app.service('rms-users-info').findOne({
            query: {
                userId: jobUpdatedLog.updatedBy,
                $select: ['id', 'firstName', 'lastName']
            }
        }).catch(_e => { return null }) : null,
    }
}

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS))],
        find: [],
        get: [],
        create: [],
        update: [disallow('external')],
        patch: [],
        remove: []
    },

    after: {
        all: [fastJoin(populateResolver)],
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
