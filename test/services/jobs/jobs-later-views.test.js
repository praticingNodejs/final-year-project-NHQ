import assert from 'assert'
import app from '../../../src/app'

describe('\'jobs-later-views\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs-later-views')

        assert.ok(service, 'Registered the service')
    })
})
