import { authenticate } from '@feathersjs/authentication'
import { setNow, fastJoin, iff, isProvider, disallow } from 'feathers-hooks-common'

import { validateRole } from '../../../hooks'
import CONSTANT from '../../../constant'

const roleResolver = {
    joins: {
        role: (..._args) => async (userSystemRole, context) => userSystemRole.role = userSystemRole.systemRoleId ? await context.app.service('system-roles').findOne({
            query: {
                id: userSystemRole.systemRoleId,
                $select: ['id', 'name']
            }
        }).then(result => {
            return result?.name
        }).catch(_e => { return null }) : null
    }
}

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'), validateRole(...CONSTANT.VALIDATE_ROLE_ARMS))],
        find: [],
        get: [],
        create: [],
        update: [disallow('external')],
        patch: [setNow('updatedAt')],
        remove: []
    },

    after: {
        all: [fastJoin(roleResolver)],
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
