import assert from 'assert'
import app from '../../../src/app'

describe('\'resume-messengers\' service', () => {
    it('registered the service', () => {
        const service = app.service('resume/messengers')

        assert.ok(service, 'Registered the service')
    })
})
