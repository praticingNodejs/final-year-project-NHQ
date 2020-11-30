import assert from 'assert'
import app from '../../../src/app'

describe('\'locations-sub\' service', () => {
    it('registered the service', () => {
        const service = app.service('locations/sub')

        assert.ok(service, 'Registered the service')
    })
})
