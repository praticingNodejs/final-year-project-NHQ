import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import { expressOauth } from '@feathersjs/authentication-oauth'

import GoogleStrategy from './authentication/GoogleStrategy'
import FacebookStrategy from './authentication/FacebookStrategy'
import AspMembership from './authentication/AspMembership'

import * as apiHook from './hooks'

class MyAuthenticationService extends AuthenticationService {
    constructor(app) {
        super(app)

    }

    async getEntityQuery(query, _params) {
        // Query for user but only include users marked as `active`
        return {
            ...query,
            status: true,
            $limit: 1
        }
    }

    async getPayload(authResult, params) {
        // Call original `getPayload` first
        const payload = await super.getPayload(authResult, params)

        const { user } = authResult

        return Object.assign(payload, {
            userId: user.id,
        })
    }
}

export default app => {
    const authentication = new MyAuthenticationService(app)

    authentication.register('jwt', new JWTStrategy())
    authentication.register('local', new LocalStrategy())
    authentication.register('aspMembership', new AspMembership(app))
    /**
     * Third parties
     */
    authentication.register('google', new GoogleStrategy())
    authentication.register('facebook', new FacebookStrategy())

    app.use('/authentication', (req, res, next) => {
        req.feathers.ip = req.ip
        req.feathers.headers = req.headers
        next()
    }, authentication)

    app.service('authentication').hooks({
        before: {
            create: [
                apiHook.checkUserExisted(),
                apiHook.validateLoginPortal(),
                apiHook.checkUserAccountStatus()
            ]
        },
        after: {
            all: [],
            create: [apiHook.getUserDeviceLogin()],
            remove: [apiHook.userLogOut()]
        },
        error: {
            create: [apiHook.errorResponse('Invalid login')]
        }
    })

    app.configure(expressOauth())
}


