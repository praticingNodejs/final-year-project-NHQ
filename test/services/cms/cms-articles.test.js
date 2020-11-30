import assert from 'assert'
import app from '../../../src/app'

describe('\'cms-articles\' service', () => {
    it('registered the service', () => {
        const service = app.service('cms/articles')

        assert.ok(service, 'Registered the service')
    })
})
