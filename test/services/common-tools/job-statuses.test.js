import assert from 'assert'
import app from '../../../src/app'

describe('\'job-statuses\' service', () => {
    it('registered the service', () => {
        const service = app.service('job-statuses')

        assert.ok(service, 'Registered the service')
    })
})
