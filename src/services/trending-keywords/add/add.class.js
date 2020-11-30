/* eslint-disable no-unused-vars */
import { filterSpecialCharacters } from '../../../utils'
import { NotAcceptable } from '@feathersjs/errors'

export class Add {
    constructor(options) {
        this.options = options || {}
    }

    setup(app) {
        this.app = (app)
    }

    async create(data, params) {
        let filteredKeyword = filterSpecialCharacters(data.text)
        let keyword = (await this.app.service('trending-keywords').find({ query: { text: filteredKeyword } })).data[0]
        let blockedKeyword = (await this.app.service('trending-keywords/blocked').find({ query: { $select: ['text'] } })).map(v => v.text)
        if (new RegExp(blockedKeyword.join('|')).test(filteredKeyword)) return
        if (keyword) {
            let updated = await this.app.service('trending-keywords').patch(keyword.id, { count: keyword.count + 1 })
            return updated
        } else {
            let created = await this.app.service('trending-keywords').create({ text: filteredKeyword, count: 1 })
            return created
        }
    }
}
