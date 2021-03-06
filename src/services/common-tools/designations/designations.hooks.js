import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

export default {
    before: {
        all: [],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [
            iff(
                isProvider('external'),
                authenticate('jwt'),
                apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS),
                apiHook.validateEmptyField(['name', 'status']),
                apiHook.commonToolCrms(),
                apiHook.checkExist('company-common-tools')
            )
        ],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.checkExist('company-common-tools'), apiHook.multiCRUD())],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS))]
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [apiHook.createCompanyCommonTools()],
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
