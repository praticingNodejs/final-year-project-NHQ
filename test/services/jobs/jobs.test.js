import assert from 'assert'
import app from '../../../src/app'

describe('\'jobs\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs')

        assert.ok(service, 'Registered the service')
    })
})
