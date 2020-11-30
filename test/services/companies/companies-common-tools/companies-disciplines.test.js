import assert from 'assert'
import app from '../../../../src/app'

describe('\'companies-disciplines\' service', () => {
    it('registered the service', () => {
        const service = app.service('companies/disciplines')

        assert.ok(service, 'Registered the service')
    })
})
