import assert from 'assert'
import app from '../../../src/app'

describe('\'users/system-roles\' service', () => {
    it('registered the service', () => {
        const service = app.service('users/system-roles')

        assert.ok(service, 'Registered the service')
    })
})
