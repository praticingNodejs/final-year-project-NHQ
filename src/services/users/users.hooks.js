import { authenticate } from '@feathersjs/authentication'
import { hooks as authHooks } from '@feathersjs/authentication-local'
import { setNow, disallow, iff, isProvider, preventChanges, fastJoin, iffElse } from 'feathers-hooks-common'
import verifyHooks from 'feathers-authentication-management'
import _ from 'lodash'

import * as apiHook from '../../hooks'
import notifier from './auth-management/notifier'
import CONSTANT from '../../constant'

const { hashPassword, protect } = authHooks
const { addVerification, removeVerification } = verifyHooks.hooks

const populateResolvers = {
    joins: {
        role: (..._args) => async (user, context) => user.role = await context.app.service('users/system-roles').find({
            query: {
                userId: user.id,
                $select: ['systemRoleId']
            },
            paginate: false
        }).then(result => {
            return result.map(({ role }) => role)
        })
    }
}

const checkRoleArms = () => async context => {
    return _.intersection(context.params.user.role, CONSTANT.VALIDATE_ROLE_ARMS).length > 0 ? true  : false
}

export default {
    before: {
        all: [],
        find: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS))],
        get: [],
        create: [
            apiHook.toLowerCaseEmail(),
            iffElse(apiHook.checkCreateUserRole('jobseeker'), [
                apiHook.checkCreate('users'),
                addVerification('/users/auth-management')
            ], [
                authenticate('jwt'),
                apiHook.checkCreateRmsRole(),
                apiHook.checkCreate('rms_users'),
                apiHook.checkIsPrimaryUser()
            ]),
            hashPassword('password'),
            setNow('createdAt')
        ],
        update: [disallow('external')],
        patch: [
            iff(
                isProvider('external'),
                preventChanges(true,
                    'email',
                    'isVerified',
                    'verifyToken',
                    'verifyExpires',
                    'verifyChanges',
                    'resetToken',
                    'resetExpires',
                    'isAspMembership',
                ),
                authenticate('jwt'),
                iffElse(checkRoleArms(), [
                    hashPassword('password')
                ], [
                    preventChanges(true, 'password')
                ]),
            ),
            setNow('updatedAt')
        ],
        remove: [
            iff(
                isProvider('external'),
                authenticate('jwt'),
                apiHook.deleteUserAccount()
            )
        ]
    },

    after: {
        all: [
            fastJoin(populateResolvers),
            protect(
                'password',
                'passwordToken',
                'refreshToken',
                'passwordSalt',
                'isAspMembership',
                'verifyExpires',
                'verifyChanges',
                'resetToken',
                'resetExpires'
            )]
        ,
        find: [],
        get: [],
        create: [
            iffElse(apiHook.checkCreateUserRole('jobseeker'), [
                apiHook.createResume(),
                apiHook.createRole(),
                async context => {
                    notifier('resendVerifySignup', context.result, '', context.app)
                    return context
                }
            ], [
                apiHook.createRmsUserInfo()
            ]),
            removeVerification()
        ],
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
