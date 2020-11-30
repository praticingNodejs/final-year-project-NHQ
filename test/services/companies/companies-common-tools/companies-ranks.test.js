import assert from 'assert'
import app from '../../../../src/app'

describe('\'companies/ranks\' service', () => {
    it('registered the service', () => {
        const service = app.service('companies/ranks')

        assert.ok(service, 'Registered the service')
    })
})
