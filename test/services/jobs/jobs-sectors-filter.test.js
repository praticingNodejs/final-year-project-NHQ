import assert from 'assert'
import app from '../../../src/app'

describe('\'jobs/sectors/filter\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/sectors/filter')

        assert.ok(service, 'Registered the service')
    })
})
