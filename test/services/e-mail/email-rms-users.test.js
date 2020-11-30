import assert from 'assert'
import app from '../../../src/app'

describe('\'email-rms-users\' service', () => {
    it('registered the service', () => {
        const service = app.service('email/rms-users')

        assert.ok(service, 'Registered the service')
    })
})
