import assert from 'assert'
import app from '../../../src/app'

describe('\'users-access-logs\' service', () => {
    it('registered the service', () => {
        const service = app.service('users/access-logs')

        assert.ok(service, 'Registered the service')
    })
})
