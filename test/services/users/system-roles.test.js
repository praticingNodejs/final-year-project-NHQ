import assert from 'assert'
import app from '../../../src/app'

describe('\'system-roles\' service', () => {
    it('registered the service', () => {
        const service = app.service('system-roles')

        assert.ok(service, 'Registered the service')
    })
})
