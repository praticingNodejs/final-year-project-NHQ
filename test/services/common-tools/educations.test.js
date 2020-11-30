import assert from 'assert'
import app from '../../../src/app'

describe('\'educations\' service', () => {
    it('registered the service', () => {
        const service = app.service('educations')

        assert.ok(service, 'Registered the service')
    })
})
