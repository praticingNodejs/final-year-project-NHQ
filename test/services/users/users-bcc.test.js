import assert from 'assert'
import app from '../../../src/app'

describe('\'users/bcc\' service', () => {
    it('registered the service', () => {
        const service = app.service('users/bcc')

        assert.ok(service, 'Registered the service')
    })
})
