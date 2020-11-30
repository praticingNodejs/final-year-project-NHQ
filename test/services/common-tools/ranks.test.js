import assert from 'assert'
import app from '../../../src/app'

describe('\'ranks\' service', () => {
    it('registered the service', () => {
        const service = app.service('ranks')

        assert.ok(service, 'Registered the service')
    })
})
