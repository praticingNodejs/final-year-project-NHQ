import assert from 'assert'
import app from '../../../../src/app'

describe('\'companies/sectors\' service', () => {
    it('registered the service', () => {
        const service = app.service('companies/sectors')

        assert.ok(service, 'Registered the service')
    })
})
