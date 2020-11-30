import assert from 'assert'
import app from '../../../../src/app'

describe('\'jobs-resume-documents\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/resume/documents')

        assert.ok(service, 'Registered the service')
    })
})
