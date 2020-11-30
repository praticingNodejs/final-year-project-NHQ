import assert from 'assert'
import app from '../../../src/app'

describe('\'resume-edit-reason\' service', () => {
    it('registered the service', () => {
        const service = app.service('resume/edit-reason')

        assert.ok(service, 'Registered the service')
    })
})
