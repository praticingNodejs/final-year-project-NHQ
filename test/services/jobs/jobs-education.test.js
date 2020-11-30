import assert from 'assert'
import app from '../../../src/app'

describe('\'jobs/educations\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/educations')

        assert.ok(service, 'Registered the service')
    })
})
