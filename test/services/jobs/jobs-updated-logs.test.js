import assert from 'assert'
import app from '../../../src/app'

describe('\'jobs/updated-logs\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/updated-logs')

        assert.ok(service, 'Registered the service')
    })
})
