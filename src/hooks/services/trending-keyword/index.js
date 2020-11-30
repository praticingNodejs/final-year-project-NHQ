// eslint-disable-next-line no-unused-vars
export const checkTrendingKeyWord = (options = {}) => {
    return async context => {
        let blockedKeyword = await context.app.service('trending-keywords/blocked').find({
            query: {
                $select: ['text']
            }
        }).then(result => {
            return result.map(({ text }) => text)
        }).catch(_e => { return [] })

        if(blockedKeyword.length)
            context.result.data = context.result.data.filter(keyword => {
                return !(new RegExp(blockedKeyword.join('|')).test(keyword.text))
            })

        return context
    }
}
