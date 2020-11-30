import assert from 'assert'
import app from '../../../src/app'

describe('\'jobs/skills\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/skills')

        assert.ok(service, 'Registered the service')
    })
})
