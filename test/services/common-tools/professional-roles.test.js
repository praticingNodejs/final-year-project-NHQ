import assert from 'assert'
import app from '../../../src/app'

describe('\'professional-roles\' service', () => {
    it('registered the service', () => {
        const service = app.service('professional-roles')

        assert.ok(service, 'Registered the service')
    })
})
