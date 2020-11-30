import assert from 'assert'
import app from '../../../../src/app'

describe('\'companies-designations\' service', () => {
    it('registered the service', () => {
        const service = app.service('companies/designations')

        assert.ok(service, 'Registered the service')
    })
})
