import assert from 'assert'
import app from '../../../../src/app'

describe('\'jobs-resume-notifications\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/resume/notifications')

        assert.ok(service, 'Registered the service')
    })
})
