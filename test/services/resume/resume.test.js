import assert from 'assert'
import app from '../../../src/app'

describe('\'resume\' service', () => {
    it('registered the service', () => {
        const service = app.service('resume')

        assert.ok(service, 'Registered the service')
    })
})
