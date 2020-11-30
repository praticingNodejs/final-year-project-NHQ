import assert from 'assert'
import app from '../../../src/app'

describe('\'sgp-residential-status\' service', () => {
    it('registered the service', () => {
        const service = app.service('sgp-residential-status')

        assert.ok(service, 'Registered the service')
    })
})
