import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS))],
        find: [
            apiHook.paginateAcceptFalse(),
            apiHook.findRms(),
            apiHook.accessLogByCompany(),
            apiHook.projectAccessLogAddKeyJoin(),
            apiHook.projectAccessLogJoinSequelize()
        ],
        get: [],
        create: [],
        update: [disallow('external')],
        patch: [],
        remove: []
    },

    after: {
        all: [],
        find: [apiHook.resJoinObject({ name: 'users.rmsUser', as: 'user' }, ['id', 'firstName', 'lastName', 'signEmail'])],
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
