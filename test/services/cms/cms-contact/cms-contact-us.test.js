import assert from 'assert'
import app from '../../../../src/app'

describe('\'cms-contact-us\' service', () => {
    it('registered the service', () => {
        const service = app.service('cms/contact-us')

        assert.ok(service, 'Registered the service')
    })
})
