import assert from 'assert'
import app from '../../../../src/app'

describe('\'jobs-resume-interview\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/resume/interview')

        assert.ok(service, 'Registered the service')
    })
})
