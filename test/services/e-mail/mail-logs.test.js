import assert from 'assert'
import app from '../../../src/app'

describe('\'/mail-logs\' service', () => {
    it('registered the service', () => {
        const service = app.service('mail-logs')

        assert.ok(service, 'Registered the service')
    })
})
