import assert from 'assert'
import app from '../../../src/app'

describe('\'nationalities\' service', () => {
    it('registered the service', () => {
        const service = app.service('nationalities')

        assert.ok(service, 'Registered the service')
    })
})
