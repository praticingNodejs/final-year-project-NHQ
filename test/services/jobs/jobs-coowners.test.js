import assert from 'assert'
import app from '../../../src/app'

describe('\'jobs-coowners\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/coowners')

        assert.ok(service, 'Registered the service')
    })
})
