import { authenticate } from '@feathersjs/authentication'
import { setNow, iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

export default {
    before: {
        all: [],
        find: [iff(isProvider('external'), apiHook.queryByFieldRms('companyId'))],
        get: [],
        create: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, CONSTANT.VALIDATE_ROLE_CRMS[0]))],
        update: [disallow('external')],
        patch: [
            iff(
                isProvider('external'),
                authenticate('jwt'),
                apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, CONSTANT.VALIDATE_ROLE_CRMS[0]),
                apiHook.updatedBy()
            ),
            setNow('updatedAt')
        ],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, CONSTANT.VALIDATE_ROLE_CRMS[0]))]
    },

    after: {
        all: [],
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
