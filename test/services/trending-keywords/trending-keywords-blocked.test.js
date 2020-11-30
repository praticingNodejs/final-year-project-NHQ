import assert from 'assert'
import app from '../../../src/app'

describe('\'trending-keywords-blocked\' service', () => {
    it('registered the service', () => {
        const service = app.service('trending-keywords/blocked')

        assert.ok(service, 'Registered the service')
    })
})
