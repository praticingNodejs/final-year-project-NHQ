import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, setNow, fastJoin, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

const commonJoin = {
    joins: {
        emailRule: (..._args) => async (emailRmsUser, context) => emailRmsUser.emailRule = emailRmsUser.emailRuleId ? await context.app.service('email/rules').get(emailRmsUser.emailRuleId, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null,
        user: (..._args) => async (emailRmsUser, context) => emailRmsUser.user = emailRmsUser.userId ? await context.app.service('rms-users-info').findOne({
            query: {
                userId: emailRmsUser.userId,
                $select: ['id', 'firstName', 'lastName']
            }
        }).then(result => {
            if (result) {
                result.firstName = result.firstName || ''
                result.lastName = result.lastName || ''
            }
            return result
        }).catch(_e => { return null }) : null,
        userEmail: (..._args) => async (emailRmsUser, context) => emailRmsUser.userEmail = (await context.app.service('users').get(emailRmsUser.userId, {
            query: {
                $select: ['email']
            }
        }).catch(_e => { return null }))?.email
    }
}

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'))],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [
            apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS),
            apiHook.validateEmptyField(['emailRuleId', 'userId', 'companyId']),
            apiHook.multiCRUD()
        ],
        update: [disallow('external')],
        patch: [
            apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS),
            setNow('updatedAt')
        ],
        remove: [apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS)]
    },

    after: {
        all: [fastJoin(commonJoin)],
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
