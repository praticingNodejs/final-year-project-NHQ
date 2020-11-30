import assert from 'assert'
import app from '../../../src/app'

describe('\'custom-emails\' service', () => {
    it('registered the service', () => {
        const service = app.service('custom-emails')

        assert.ok(service, 'Registered the service')
    })
})
