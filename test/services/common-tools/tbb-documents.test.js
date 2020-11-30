import assert from 'assert'
import app from '../../../src/app'

describe('\'tbb-documents\' service', () => {
    it('registered the service', () => {
        const service = app.service('tbb-documents')

        assert.ok(service, 'Registered the service')
    })
})
