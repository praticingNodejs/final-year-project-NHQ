import assert from 'assert'
import app from '../../../src/app'

describe('\'sector-mappings\' service', () => {
    it('registered the service', () => {
        const service = app.service('sector-mappings')

        assert.ok(service, 'Registered the service')
    })
})
