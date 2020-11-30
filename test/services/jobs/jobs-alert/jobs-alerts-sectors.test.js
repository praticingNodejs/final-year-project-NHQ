import assert from 'assert'
import app from '../../../../src/app'

describe('\'jobs-alerts-sectors\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/alerts/sectors')

        assert.ok(service, 'Registered the service')
    })
})
