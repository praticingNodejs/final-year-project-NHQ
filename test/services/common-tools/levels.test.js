import assert from 'assert'
import app from '../../../src/app'

describe('\'levels\' service', () => {
    it('registered the service', () => {
        const service = app.service('levels')

        assert.ok(service, 'Registered the service')
    })
})
