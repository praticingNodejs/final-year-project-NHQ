/* eslint-disable no-unused-vars */
export class Ping {
    constructor(options) {
        this.options = options || {}
    }

    async find(params) {
        return { message: 'Sever is online' }
    }
}
