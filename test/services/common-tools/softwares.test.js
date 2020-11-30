import assert from 'assert'
import app from '../../../src/app'

describe('\'softwares\' service', () => {
    it('registered the service', () => {
        const service = app.service('softwares')

        assert.ok(service, 'Registered the service')
    })
})
