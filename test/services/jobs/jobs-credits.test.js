import assert from 'assert'
import app from '../../../src/app'

describe('\'jobs-credits\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/credits')

        assert.ok(service, 'Registered the service')
    })
})
