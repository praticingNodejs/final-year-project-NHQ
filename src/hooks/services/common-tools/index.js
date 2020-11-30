// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import { BadRequest } from '@feathersjs/errors'

// eslint-disable-next-line no-unused-vars
export const checkExist = (options = {}) => {
    return async context => {
        const { path, data } = context
        if (!Array.isArray(context.data)) {
            if (options === 'common-tools') { // check duplicate in normal tool
                let query = {
                    name: {
                        $iLike: data.name
                    }
                }

                if (context.method === 'patch' && !Array.isArray(data)) { // patch single
                    query.id = { // find the name without current name of request tools
                        $ne: context.id
                    }
                }

                const commonTool = await context.app.service(path).findOne({ query })
                if (commonTool) // if exist
                    throw new BadRequest('DUPLICATE_ITEM_NAME')
            }

            if (options === 'company-common-tools') { // check in companies common tool (rank, discipline, designation)
                let queryCommonTool = { // find in arms tools
                    name: {
                        $iLike: data.name
                    },
                    companyId: null,
                    addedByCRMS: false
                }

                // query arms/crms tool
                // const armsTool = await context.app.service(path).findOne({ query: queryCommonTool })
                // if (armsTool)
                //     throw new BadRequest('DUPLICATE_ITEM_NAME')

                if (context.method === 'patch' && !Array.isArray(data)) { // patch single
                    queryCommonTool.id = { // find the name without current name of request tools
                        $ne: context.id
                    }
                }

                if (context.data.addedByCRMS && context.data.companyId) { // if is crms, find in crms tool with companyId and addedByCRMS from previous hook
                    queryCommonTool.companyId = context.data.companyId
                    queryCommonTool.addedByCRMS = true
                }

                const commonTool = await context.app.service(path).findOne({ query: queryCommonTool }) // query arms/crms tool

                if (commonTool) { // if existed
                    if (context.data.addedByCRMS && context.data.companyId) { // if is crms tool, check
                        let query = { // query in crms tool
                            companyId: context.data.companyId
                        }

                        if (path === 'ranks') query.rankId = commonTool.id
                        if (path === 'designations') query.designationId = commonTool.id
                        if (path === 'disciplines') query.disciplineId = commonTool.id

                        const companyTools = await context.app.service(`companies/${path}`).findOne({ query })
                        if (companyTools) { // if exist in crms tool, throw new Error
                            throw new BadRequest('DUPLICATE_ITEM_NAME')
                        } else { // if not exist in crms tool - return context
                            return context
                        }
                    } else { // if is not crms tool, throw duplicate item because it is arms tool
                        throw new BadRequest('DUPLICATE_ITEM_NAME')
                    }
                }
            }
        }
        return context
    }
}
