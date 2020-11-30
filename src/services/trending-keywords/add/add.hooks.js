import { authenticate } from '@feathersjs/authentication'
import { validateRole } from '../../../hooks'
import { iff, isProvider, disallow } from 'feathers-hooks-common'
import CONSTANT from '../../../constant'

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'), validateRole(...CONSTANT.VALIDATE_ROLE_ARMS))],
        find: [],
        get: [],
        create: [],
        update: [disallow('external')],
        patch: [],
        remove: []
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
