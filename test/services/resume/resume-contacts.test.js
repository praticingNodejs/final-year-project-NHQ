import assert from 'assert'
import app from '../../../src/app'

describe('\'resume-contacts\' service', () => {
    it('registered the service', () => {
        const service = app.service('resume/contacts')

        assert.ok(service, 'Registered the service')
    })
})
