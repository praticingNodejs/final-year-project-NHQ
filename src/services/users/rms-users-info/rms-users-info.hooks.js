import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, fastJoin, setNow, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'
import { BadRequest, GeneralError } from '@feathersjs/errors'

const populateResolvers = {
    joins: {
        company: (..._args) => async (user, context) => user.company = user.companyId ? await context.app.service('companies').get(user.companyId, {
            query: {
                $select: ['id', 'name', 'imagePath', 'companyUrl', 'website', 'weekWorkHours', 'country', 'description', 'status', 'subscriptionEndDate', 'isBrandedFormat']
            }
        }).catch(_e => { return _e }) : null,
        user: (..._args) => async (user, context) => user.user = user.userId ? await context.app.service('users').get(user.userId, {
            query: {
                $select: ['id', 'email', 'createdAt']
            }
        }).catch(_e => { return null }) : null,
        residentialStatus: (..._args) => async (user, context) => user.residentialStatus = user.sgpResidentialStatus ? await context.app.service('sgp-residential-status').get(user.sgpResidentialStatus, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null,
        emailBcc: (..._args) => async (user, context) => {
            if (user.userId)
                user.emailBcc = await context.app.service('users/bcc').find({
                    query: {
                        userId: user.userId,
                        $select: ['id', 'email']
                    },
                    paginate: false
                }).catch(_e => { return [] })
            return context
        }
    }
}

export default {
    before: {
        all: [
            iff(
                isProvider('external'),
                authenticate('jwt'),
                apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS),
                apiHook.findRms()
            )
        ],
        find: [
            apiHook.paginateAcceptFalse(),
            iff(
                isProvider('external'),
                apiHook.validateUserFind(),
                apiHook.queryNull(['companyId']),
                apiHook.searchFullNameRms(),
                apiHook.filterRole()
            )
        ],
        get: [],
        create: [
            setNow('createdAt')
        ],
        update: [disallow('external')],
        patch: [
            apiHook.checkPatchCrmsRole(),
            iff(isProvider('external'), async context => {
                if(context.data.email) {
                    const oldUser = await context.app.service('users').findOne({
                        query: {
                            email: context.data.oldEmail,
                            $select: ['id']
                        }
                    }).then(result => {
                        if(!result) throw new BadRequest('USER_NOT_EXISTED')
                        return result
                    }).catch(_err => {
                        return new GeneralError('ERR_CONNECTION')
                    })

                    context.app.service('users').patch(oldUser.id, {
                        email: context.data.email
                    }).catch(_err => { return true })
                }
                return context
            })
        ],
        remove: []
    },

    after: {
        all: [fastJoin(populateResolvers)],
        find: [],
        get: [
            async context => {
                if (context.params.rmsUser?.companyId && context.result.companyId !== context.params.rmsUser.companyId)
                    throw new BadRequest('USER_NOT_ALLOWED')
                return context
            }
        ],
        create: [],
        update: [],
        patch: [],
        remove: [apiHook.removeRmsUsers()]
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
