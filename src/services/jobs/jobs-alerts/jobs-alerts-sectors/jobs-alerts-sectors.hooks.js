import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, fastJoin, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../../hooks'

const commonJoins = {
    joins: {
        sector: (..._args) => async (jobsAlertSectors, context) => jobsAlertSectors.sector = jobsAlertSectors.sectorId ? await context.app.service('sectors').get(jobsAlertSectors.sectorId, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null
    }
}

export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'))],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.multiCRUD())]
    },

    after: {
        all: [fastJoin(commonJoins)],
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
