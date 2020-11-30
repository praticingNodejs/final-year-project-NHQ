import assert from 'assert'
import app from '../../../src/app'

describe('\'resume-work-experience\' service', () => {
    it('registered the service', () => {
        const service = app.service('resume/work-experience')

        assert.ok(service, 'Registered the service')
    })
})
