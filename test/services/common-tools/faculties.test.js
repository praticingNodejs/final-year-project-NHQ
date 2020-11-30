import assert from 'assert'
import app from '../../../src/app'

describe('\'faculties\' service', () => {
    it('registered the service', () => {
        const service = app.service('faculties')

        assert.ok(service, 'Registered the service')
    })
})
