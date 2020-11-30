import assert from 'assert'
import app from '../../../src/app'

describe('\'cms-news-events\' service', () => {
    it('registered the service', () => {
        const service = app.service('cms/news-events')

        assert.ok(service, 'Registered the service')
    })
})
