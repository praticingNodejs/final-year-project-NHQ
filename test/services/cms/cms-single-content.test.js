import assert from 'assert'
import app from '../../../src/app'

describe('\'cms-single-content\' service', () => {
    it('registered the service', () => {
        const service = app.service('cms/single-content')

        assert.ok(service, 'Registered the service')
    })
})
