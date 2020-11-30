import assert from 'assert'
import app from '../../../src/app'

describe('\'cms-social-links\' service', () => {
    it('registered the service', () => {
        const service = app.service('cms/social-links')

        assert.ok(service, 'Registered the service')
    })
})
