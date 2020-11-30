import Bowser from 'bowser'
import { BadRequest, NotAuthenticated } from '@feathersjs/errors'
import moment from 'moment-timezone'

import CONSTANT from '../../../constant'

// eslint-disable-next-line no-unused-vars
export const checkUserExisted = (options = {}) => {
    return async context => {
        if (!context.data.strategy) context.data.strategy = 'local'
        if (!context.data.email || !context.data.password) {
            throw new BadRequest('MISSING_FIELD_REQUIRED')
        }

        context.data.email = context.data.email?.trim()
        context.data.email = context.data.email?.toLowerCase()

        let user = await context.app.service('users').findOne({
            query: {
                email: context.data.email
            }
        }).catch(_e => { return null })
        context.params.user = user
        if (!user || !user.isVerified || user.isVerified === false) {
            throw new NotAuthenticated('INVALID_EMAIL') // not verified
        }

        if (user.isAspMembership) context.data.strategy = 'aspMembership'

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const checkUserAccountStatus = (options = {}) => {
    return async context => {
        let rmsUser = await context.app.service('rms-users-info').findOne({
            query: {
                userId: context.params.user?.id,
                $select: ['id', 'status', 'companyId']
            }
        }).catch(_e => { return null })

        let jsUser = await context.app.service('resume').findOne({
            query: {
                userId: context.params.user?.id,
                $select: ['id', 'isActive']
            }
        }).catch(_e => { return null })

        if (!rmsUser && !jsUser)
            throw new NotAuthenticated('USER_NOT_EXISTED')

        if (rmsUser && rmsUser.company?.subscriptionEndDate < moment(new Date()).format('YYYY-MM-DD')) {
            await context.app.service('companies').patch(rmsUser.companyId, {
                status: 0
            })
            throw new NotAuthenticated('USER_NOT_EXISTED')
        }

        if ((String(rmsUser?.status) === '0' || String(rmsUser?.company?.status) === '0') || String(jsUser?.isActive) === '0') {
            throw new NotAuthenticated('USER_NOT_EXISTED')
        }
    }
}

// eslint-disable-next-line no-unused-vars
export const userLogOut = (options = {}) => {
    return async context => {
        context.app.service('users').patch(context.result.user.id, {
            passwordToken: null,
            refreshToken: null
        })
        delete context.result.user
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const getUserDeviceLogin = (options = {}) => {
    return async context => {
        const browser = Bowser.getParser(context.params.headers['user-agent'])
        const { name, version } = browser.getBrowser()

        const user = await context.app.service('users').patch(context.result.user.id, {
            passwordToken: context.result.accessToken
        })

        if (name !== '' && context.params.ip !== '::1' && context.params.ip !== '127.0.0.1')
            await context.app.service('users/access-logs').create({
                userId: user.id,
                ipAddress: context.params.ip,
                browser: `${name} ${version}`
            })

        if (!user.refreshToken) {
            context.result.refreshToken = await context.app.service('authentication').createAccessToken({
                userId: user.id,
                sub: user.id
            }, CONSTANT.TOKEN_OPTIONS.PATCH_JOB_RESUME_TOKEN, CONSTANT.TOKEN_SECRET)

            context.app.service('users').patch(user.id, {
                refreshToken: context.result.refreshToken
            })
        }

        return context
    }
}
