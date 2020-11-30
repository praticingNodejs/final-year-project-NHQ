import assert from 'assert'
import app from '../../../src/app'

describe('\'rms-users-info\' service', () => {
    it('registered the service', () => {
        const service = app.service('rms-users-info')

        assert.ok(service, 'Registered the service')
    })
})
