import assert from 'assert'
import app from '../../../src/app'

describe('\'resume-documents\' service', () => {
    it('registered the service', () => {
        const service = app.service('resume/documents')

        assert.ok(service, 'Registered the service')
    })
})
