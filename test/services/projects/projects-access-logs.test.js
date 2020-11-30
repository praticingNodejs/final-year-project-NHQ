import assert from 'assert'
import app from '../../../src/app'

describe('\'projects-access-logs\' service', () => {
    it('registered the service', () => {
        const service = app.service('projects/access-logs')

        assert.ok(service, 'Registered the service')
    })
})
