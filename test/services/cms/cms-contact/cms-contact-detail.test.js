import assert from 'assert'
import app from '../../../../src/app'

describe('\'cms/contact-detail\' service', () => {
    it('registered the service', () => {
        const service = app.service('cms/contact-detail')

        assert.ok(service, 'Registered the service')
    })
})
