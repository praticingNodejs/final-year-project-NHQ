import { authenticate } from '@feathersjs/authentication'
import { fastJoin, iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'

const resumeSectorResolvers = {
    joins: {
        contacts: (..._args) => async (resumeSector, context) => resumeSector.sectorId ? resumeSector.sector = await context.app.service('sectors').get(resumeSector.sectorId, {
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
        create: [apiHook.multiCRUD()],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt')), apiHook.multiCRUD()],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.autoPatchCloneResumeService()), apiHook.multiCRUD()]
    },

    after: {
        all: [fastJoin(resumeSectorResolvers)],
        find: [],
        get: [],
        create: [iff(isProvider('external'), apiHook.autoPatchCloneResumeService())],
        update: [iff(isProvider('external'), apiHook.autoPatchCloneResumeService())],
        patch: [],
        remove: [iff(isProvider('external'), apiHook.autoPatchCloneResumeService())]
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
