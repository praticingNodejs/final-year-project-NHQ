import assert from 'assert'
import app from '../../../../src/app'

describe('\'jobs-resume-acknowledgements\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/resume/acknowledgements')

        assert.ok(service, 'Registered the service')
    })
})
