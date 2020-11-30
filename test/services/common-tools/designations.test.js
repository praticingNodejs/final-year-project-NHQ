import assert from 'assert'
import app from '../../../src/app'

describe('\'designations\' service', () => {
    it('registered the service', () => {
        const service = app.service('designations')

        assert.ok(service, 'Registered the service')
    })
})
