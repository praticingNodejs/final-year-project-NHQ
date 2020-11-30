import assert from 'assert'
import app from '../../../src/app'

describe('\'seo\' service', () => {
    it('registered the service', () => {
        const service = app.service('seo')

        assert.ok(service, 'Registered the service')
    })
})
