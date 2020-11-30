import { authenticate } from '@feathersjs/authentication'
import { fastJoin, iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

const jobResolvers = {
    joins: {
        consultant: (..._args) => async (jobCoowner, context) => {
            jobCoowner.consultant = jobCoowner.consultantId ? await context.app.service('rms-users-info').findOne({
                query: {
                    userId: jobCoowner.consultantId,
                    $select: ['id', 'userId', 'firstName', 'lastName']
                }
            }).catch(_e => { return null }) : null

            jobCoowner.consultantFullName = (jobCoowner.consultant?.firstName || '') + ' ' + (jobCoowner.consultant?.lastName || '')
            if (jobCoowner.consultantFullName === ' ') jobCoowner.consultantFullName = null
            if (jobCoowner.consultant === undefined) jobCoowner.consultant = null
        }
    }
}
export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS)),
            apiHook.validateEmptyField(['jobId', 'consultantId']),
            apiHook.multiCRUD()
        ],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS))],
        remove: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS)),
            apiHook.multiCRUD()
        ]
    },

    after: {
        all: [],
        find: [fastJoin(jobResolvers)],
        get: [fastJoin(jobResolvers)],
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
