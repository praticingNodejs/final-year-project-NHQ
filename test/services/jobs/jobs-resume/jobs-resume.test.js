import assert from 'assert'
import app from '../../../../src/app'

describe('\'jobs/resume\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/resume')

        assert.ok(service, 'Registered the service')
    })
})
