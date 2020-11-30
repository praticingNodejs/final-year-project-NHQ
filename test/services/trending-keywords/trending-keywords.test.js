import assert from 'assert'
import app from '../../../src/app'

describe('\'trending-keywords\' service', () => {
    it('registered the service', () => {
        const service = app.service('trending-keywords')

        assert.ok(service, 'Registered the service')
    })
})
