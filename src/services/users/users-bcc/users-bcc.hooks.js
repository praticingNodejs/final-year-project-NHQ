import { authenticate } from '@feathersjs/authentication'
import { disallow, iff, isProvider } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'
import { BadRequest } from '@feathersjs/errors'

export default {
    before: {
        all: [
            iff(
                isProvider('external'),
                authenticate('jwt'),
                apiHook.findRms(),
                apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_CRMS, ...CONSTANT.VALIDATE_ROLE_ARMS),
                apiHook.multiCRUD()
            )
        ],
        find: [
            apiHook.paginateAcceptFalse(),
            iff(isProvider('external'), async context => {
                if (context.params.query.userId) {
                    const rmsUser = await context.app.service('rms-users-info').findOne({
                        query: {
                            userId: context.params.query.userId,
                            $select: ['companyId']
                        }
                    })

                    if (rmsUser && rmsUser.companyId !== context.params.rmsUser.companyId)
                        throw new BadRequest('USER_NOT_ALLOWED')
                }
                return context
            })

        ],
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
