import { OAuthStrategy } from '@feathersjs/authentication-oauth'

class GoogleStrategy extends OAuthStrategy {

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

        // this will set 'googleId'
        const baseData = await super.getEntityData(profile)

        // this will grab the picture and email address of the Google profile
        return {
            ...baseData,
            email: profile.email,
            avatar: profile.picture,
            displayName: profile.name,
            firstName: profile.given_name,
            lastName: profile.family_name,
            verified: profile.email_verified
        }
    }
}

export default GoogleStrategy