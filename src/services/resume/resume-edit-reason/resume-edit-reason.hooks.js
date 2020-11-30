import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, fastJoin, disallow, setNow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'

const resumeEditReasonResolver = {
    joins: {
        updatedBy: (..._args) => async (resumeEditReason, context) => resumeEditReason.updatedBy = await context.app.service('rms-users-info').findOne({
            query: {
                userId: resumeEditReason.updatedBy,
                $select: ['id', 'firstName', 'lastName', 'companyId']
            }
        }).catch(_e => { return null })
    }
}

export default {
    before: {
        all: [],
        find: [
            iff(isProvider('external'), authenticate('jwt')),
            apiHook.paginateAcceptFalse()
        ],
        get: [disallow('external')],
        create: [disallow('external'), setNow('createdAt')],
        update: [disallow('external')],
        patch: [disallow('external')],
        remove: [disallow('external')]
    },

    after: {
        all: [fastJoin(resumeEditReasonResolver)],
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
