import assert from 'assert'
import app from '../../../src/app'

describe('\'prof-affiliations\' service', () => {
    it('registered the service', () => {
        const service = app.service('prof-affiliations')

        assert.ok(service, 'Registered the service')
    })
})
