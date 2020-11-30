import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, setNow, fastJoin, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../../hooks'

const joinExternal = {
    joins: {
        consultant: (..._args) => async (jobsResumeVisitor, context) => {
            const rmsUser = await context.app.service('rms-users-info').findOne({
                query: {
                    userId: jobsResumeVisitor.consultantId,
                    $select: ['id', 'firstName', 'lastName']
                }
            }).catch(_e => { return null })

            jobsResumeVisitor.consultant = {
                firstName: rmsUser?.firstName,
                lastName: rmsUser?.lastName
            }
        }
    }
}

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'))],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [
            apiHook.validateEmptyField(['consultantId']),
            iff(isProvider('external'), apiHook.remarkJobsResumeVisitor()),
            apiHook.multiCRUD(),
            setNow('createdAt')
        ],
        update: [disallow('external')],
        patch: [],
        remove: []
    },

    after: {
        all: [fastJoin(joinExternal)],
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
