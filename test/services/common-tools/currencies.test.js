import assert from 'assert'
import app from '../../../src/app'

describe('\'currencies\' service', () => {
    it('registered the service', () => {
        const service = app.service('currencies')

        assert.ok(service, 'Registered the service')
    })
})
