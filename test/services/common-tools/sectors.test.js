import assert from 'assert'
import app from '../../../src/app'

describe('\'sectors\' service', () => {
    it('registered the service', () => {
        const service = app.service('sectors')

        assert.ok(service, 'Registered the service')
    })
})
