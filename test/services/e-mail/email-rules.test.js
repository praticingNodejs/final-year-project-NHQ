import assert from 'assert'
import app from '../../../src/app'

describe('\'email-rules\' service', () => {
    it('registered the service', () => {
        const service = app.service('email/rules')

        assert.ok(service, 'Registered the service')
    })
})
