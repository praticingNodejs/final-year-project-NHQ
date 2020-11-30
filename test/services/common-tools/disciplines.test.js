import assert from 'assert'
import app from '../../../src/app'

describe('\'disciplines\' service', () => {
    it('registered the service', () => {
        const service = app.service('disciplines')

        assert.ok(service, 'Registered the service')
    })
})
