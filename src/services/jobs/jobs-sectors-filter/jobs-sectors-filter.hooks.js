import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, disallow, fastJoin } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

const commonJoin = {
    joins: {
        sector: (..._args) => async (jobsSectorFilter, context) => jobsSectorFilter.sector = await context.app.service('sectors').get(jobsSectorFilter.sectorId, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null })
    }
}

export default {
    before: {
        all: [],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.multiCRUD()),
            apiHook.validateEmptyField(['jobId', 'sectorId'])
        ],
        update: [disallow('external')],
        patch: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.multiCRUD()),
        ],
        remove: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.multiCRUD())
        ]
    },

    after: {
        all: [fastJoin(commonJoin)],
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
