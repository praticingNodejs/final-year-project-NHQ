import assert from 'assert'
import app from '../../../src/app'

describe('\'designated-users\' service', () => {
    it('registered the service', () => {
        const service = app.service('designated-users')

        assert.ok(service, 'Registered the service')
    })
})
