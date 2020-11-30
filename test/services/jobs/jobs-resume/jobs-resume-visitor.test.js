import assert from 'assert'
import app from '../../../../src/app'

describe('\'jobs resume visitor\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/resume/visitor')

        assert.ok(service, 'Registered the service')
    })
})
