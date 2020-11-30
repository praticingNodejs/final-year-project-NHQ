import assert from 'assert'
import app from '../../../src/app'

describe('\'expertises\' service', () => {
    it('registered the service', () => {
        const service = app.service('expertises')

        assert.ok(service, 'Registered the service')
    })
})
