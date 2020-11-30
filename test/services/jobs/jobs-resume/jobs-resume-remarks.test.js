import assert from 'assert'
import app from '../../../../src/app'

describe('\'jobs-resume-remarks\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/resume/remarks')

        assert.ok(service, 'Registered the service')
    })
})
