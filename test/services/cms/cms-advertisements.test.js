import assert from 'assert'
import app from '../../../src/app'

describe('\'cms/ads\' service', () => {
    it('registered the service', () => {
        const service = app.service('cms/ads')

        assert.ok(service, 'Registered the service')
    })
})
