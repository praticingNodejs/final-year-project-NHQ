import assert from 'assert'
import app from '../../../src/app'

describe('\'projects/contacts\' service', () => {
    it('registered the service', () => {
        const service = app.service('projects/contacts')

        assert.ok(service, 'Registered the service')
    })
})
