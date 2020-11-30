import assert from 'assert'
import app from '../../src/app'

describe('\'ping\' service', () => {
    it('registered the service', () => {
        const service = app.service('ping')

        assert.ok(service, 'Registered the service')
    })
})
