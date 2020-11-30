import assert from 'assert'
import app from '../../../../src/app'

describe('\'jobs-alerts-positions\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/alerts/positions')

        assert.ok(service, 'Registered the service')
    })
})
