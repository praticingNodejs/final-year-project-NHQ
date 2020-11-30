import assert from 'assert'
import app from '../../../src/app'

describe('\'jobs/project-contacts\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/project-contacts')

        assert.ok(service, 'Registered the service')
    })
})
