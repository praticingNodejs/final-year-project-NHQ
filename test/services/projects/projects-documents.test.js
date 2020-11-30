import assert from 'assert'
import app from '../../../src/app'

describe('\'projects-documents\' service', () => {
    it('registered the service', () => {
        const service = app.service('projects/documents')

        assert.ok(service, 'Registered the service')
    })
})
