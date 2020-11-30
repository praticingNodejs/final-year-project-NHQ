import { OAuthStrategy } from '@feathersjs/authentication-oauth'
import axios from 'axios'

class FacebookStrategy extends OAuthStrategy {

    async getRedirect(authResult) {
        // const { user } = authResult
        // Get the redirect url e.g. from the users organization
        // const { redirectUrl } = await app.service('organizations').get(user.organizationId)
        // This is necessary if it should work with the standard Authentication
        // client (which could be customized as well)
        if (authResult.accessToken) {
            return `http://localhost:3030/?access_token=${authResult.accessToken}`
        }
        return 'http://localhost:3030/authenticate?error=OAuth%20Authentication%20not%20successful'
    }

    async getProfile(authResult) {
        // This is the oAuth access token that can be used
        // for Facebook API requests as the Bearer token
        const accessToken = authResult.access_token

        const { data } = await axios.get('https://graph.facebook.com/me', {
            headers: {
                authorization: `Bearer ${accessToken}`
            },
            params: {
                // There are 
                fields: 'id, name, email, picture'
            }
        })

        return data
    }

    async getPayload(authResult, params) {
        // Call original `getPayload` first
        const payload = await super.getPayload(authResult, params)

        const { user } = authResult

        return Object.assign(payload, {
            userId: user.id,
            role: user.role,
        })
    }

    async getEntityData(profile) {

        // `profile` is the data returned by getProfile
        const baseData = await super.getEntityData(profile)
        const splitName = profile.name.split(' ')

        return {
            ...baseData,
            email: profile.email,
            displayName: profile.name,
            firstName: splitName[0],
            lastName: splitName.splice(1).join(' '),
            avatar: profile.picture.data.url,
            verified: true
        }
    }
}

export default FacebookStrategy