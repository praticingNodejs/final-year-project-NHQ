import assert from 'assert'
import app from '../../../src/app'

describe('\'locations\' service', () => {
    it('registered the service', () => {
        const service = app.service('locations')

        assert.ok(service, 'Registered the service')
    })
})
