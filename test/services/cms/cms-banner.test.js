import assert from 'assert'
import app from '../../../src/app'

describe('\'cms/banner\' service', () => {
    it('registered the service', () => {
        const service = app.service('cms/banner')

        assert.ok(service, 'Registered the service')
    })
})
