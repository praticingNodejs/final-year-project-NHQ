import assert from 'assert'
import app from '../../../../src/app'

describe('\'jobs/alerts\' service', () => {
    it('registered the service', () => {
        const service = app.service('jobs/alerts')

        assert.ok(service, 'Registered the service')
    })
})
