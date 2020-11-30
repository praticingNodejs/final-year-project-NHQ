// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import JwtDecode from 'jwt-decode'
import { Op } from 'sequelize'
import { NotAuthenticated, BadRequest, NotAcceptable } from '@feathersjs/errors'
import _ from 'lodash'

import { dynamicSort } from '../../../utils'
import CONSTANT from '../../../constant'

// eslint-disable-next-line no-unused-vars
export const companiesCommonTools = (options = {}) => {
    return async context => {
        if (context.type === 'before') {
            let decodeToken

            try {
                decodeToken = JwtDecode(context.params.authentication.accessToken)
            } catch (err) {
                throw new NotAuthenticated('INVALID_TOKEN')
            }

            const user = await context.app.service('rms-users-info').findOne({
                query: {
                    userId: decodeToken.userId,
                    $select: ['id', 'companyId']
                }
            }).catch(_e => { return null })

            context.params.query.companyId = user ? user.companyId : null
        }

        if (context.type === 'after') {
            if (context.params.query.status !== '0') {
                let armsCommonTools = []
                let currentArmsId
                if (Array.isArray(context.result) && context.result.length === 0) // if context.result null means the data is in arms
                    // find the arms tools in crms then select the arms NOT IN crms
                    currentArmsId = await context.app.service(context.path).find({
                        query: {
                            companyId: context.params.query.companyId,
                            status: 0,
                            addedByCRMS: false
                        },
                        paginate: false
                    }).catch(_e => { return null })

                let serviceId = options.substring(0, options.length - 1) + 'Id' // get service path

                // if the context.result null means the first query is an empty array, it will find in the crms tools in previous step, then return as currentArmsId
                // currentArmsId will have value of arms tools in crms in 2nd request (recursion)
                let mapArray = context.result.length > 0 ? context.result : currentArmsId

                // get the similar tools id
                currentArmsId = mapArray.map(e => e[serviceId])

                const listArms = await context.app.service(options).find({
                    query: {
                        addedByCRMS: false,
                        companyId: null,
                        status: 1,
                        id: {
                            [Op.notIn]: currentArmsId
                        },
                        $select: ['id', 'name', 'status'],
                    },
                    paginate: false
                }).catch(_e => { return null })

                if (Array.isArray(listArms) && listArms.length > 0)
                    listArms.map(e => {
                        let obj = {
                            id: e.id,
                            status: e.status,
                            [serviceId]: e.id,
                            companyId: null,
                            name: e.name,
                            addedByCRMS: false
                        }

                        armsCommonTools.push(obj)
                    })

                context.result = context.result.concat(armsCommonTools)
            }
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const commonToolCrms = (options = {}) => {
    return async context => {
        let decodeToken

        try {
            decodeToken = JwtDecode(context.params.authentication.accessToken)
        } catch (err) {
            throw new NotAuthenticated('INVALID_TOKEN')
        }

        const rmsUser = await context.app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'companyId']
            }
        })

        let checkAddedByCrms = false

        if (_.intersection(rmsUser.user.role, CONSTANT.VALIDATE_ROLE_CRMS).length > 0) {
            checkAddedByCrms = true
        }

        if (context.method === 'create') {
            context.data.companyId = rmsUser.companyId
            context.data.addedByCRMS = checkAddedByCrms
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const sortCompaniesTools = (options = {}) => {
    return async context => {
        let data = context.result
        if (context.params.sortJoin?.name) {
            let name = context.params.sortJoin?.name === '-1' ? '-name' : 'name'
            context.result = data.sort(dynamicSort(name))
        }

        if (context.params.query.$sort?.status) {
            let status = context.params.query.$sort?.status === '-1' ? '-status' : 'status'
            context.result = data.sort(dynamicSort(status))
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const crmsMultiPatchTools = (options = {}) => {
    return async context => {
        let decodeToken
        try {
            decodeToken = JwtDecode(context.params.authentication.accessToken)
        } catch (err) {
            throw new NotAcceptable('INVALID_TOKEN')
        }

        const companyId = (await context.app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'companyId']
            }
        })).companyId

        if (Array.isArray(context.data)) {
            context.data.map(async (tool, index) => {
                if (!tool.id) throw new BadRequest('ID_IS_REQUIRED')
                const service = context.path.split('/')[1] // get common tools path
                let queryId = service.substring(0, service.length - 1) + 'Id' // ex: sector -> sectorId

                // first look in the companies/tools
                let armsTool = await context.app.service(service).get(tool.id).catch(_e => { return null })
                if (armsTool) { // if exist arms, check it in crms tools
                    let crmsTool = await context.app.service(context.path).findOne({
                        query: {
                            companyId: companyId,
                            [queryId]: armsTool.id
                        }
                    }).catch(_e => { return null })

                    if (crmsTool) { // if exist in crms tools
                        // if the tools exist in the companies tool and already have raw data with status = 1
                        // it should update the raw data to 0
                        if (context.data[index].status === 0)
                            context.app.service(context.path).patch(null, {
                                status: 0
                            }, {
                                query: {
                                    companyId: companyId,
                                    [queryId]: armsTool.id
                                }
                            })

                        if (context.data[index].status === 1)  // exist context.data.status = 1 -> remove from crms tools
                            context.app.service(context.path).remove(null, {
                                query: {
                                    companyId: companyId,
                                    [queryId]: armsTool.id
                                }
                            })

                        return context
                    }

                    if (!crmsTool) { // if NOT exist in crms tools and exist context.data.status
                        if (context.data[index].status === 0)
                            context.app.service(context.path).create({ // create new arms tools in crms tools with status = 0
                                status: 0,
                                companyId: companyId,
                                [queryId]: armsTool.id,
                                addedByCRMS: false
                            })


                        // if the tools exist in the companies tool and already have raw data with status = 0
                        // it should update the raw data to 1
                        if (context.data[index].status === 1)
                            context.app.service(context.path).patch(null, {
                                status: 1
                            }, {
                                query: {
                                    companyId: companyId,
                                    [queryId]: armsTool.id
                                }
                            })

                        return context
                    }

                    throw new BadRequest('INVALID_REQUEST')
                } else { // is crms tools
                    context.app.service(context.path).get(tool.id).then(async result => { // find it in crms tools
                        let obj = {}
                        if (tool.name) obj.name = tool.name
                        if ((tool.status !== null && tool.status !== undefined) || tool.name) { // if exist tool status or tool name -> patch it in crms
                            context.app.service(context.path).patch(tool.id, {
                                status: tool.status
                            })
                            obj.status = tool.status
                            context.app.service(service).patch(result[queryId], obj)
                        }
                    })

                    return context
                }
            })
        } else
            throw new BadRequest('WRONG_TYPE_BODY')
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const createCompanyCommonTools = (options = {}) => {
    return async context => {
        if (context.result.addedByCRMS && context.result.companyId) {
            let obj = {
                status: 1,
                companyId: context.result.companyId,
                addedByCRMS: context.result.addedByCRMS
            }

            if (context.path === 'ranks') obj.rankId = context.result.id
            if (context.path === 'designations') obj.designationId = context.result.id
            if (context.path === 'disciplines') obj.disciplineId = context.result.id

            await context.app.service(`companies/${context.path}`).create(obj)
        }
        return context
    }
}
