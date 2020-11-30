import assert from 'assert'
import app from '../../../src/app'

describe('\'trending-keywords/add\' service', () => {
    it('registered the service', () => {
        const service = app.service('trending-keywords/add')

        assert.ok(service, 'Registered the service')
    })
})
