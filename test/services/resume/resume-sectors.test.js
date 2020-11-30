import assert from 'assert'
import app from '../../../src/app'

describe('\'resume-sectors\' service', () => {
    it('registered the service', () => {
        const service = app.service('resume/sectors')

        assert.ok(service, 'Registered the service')
    })
})
