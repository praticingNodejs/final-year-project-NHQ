// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import CONSTANT from '../../../constant'
import { s3Crms as s3 } from '../../../utils'
import { BadRequest } from '@feathersjs/errors'

// eslint-disable-next-line no-unused-vars
export const removeProjectDocs = (options = {}) => {
    return async context => {
        const project = await context.app.service('projects').get(context.result.projectId, {
            query: {
                $select: ['id', 'companyId']
            }
        }).catch(_err => { throw new BadRequest('PROJECT_NOT_EXISTED') })

        const company = await context.app.service('companies').get(project.companyId, {
            query: {
                $select: ['id', 'companyUrl']
            }
        }).catch(_err => { throw new BadRequest('COMPANY_NOT_EXISTED') })

        s3.deleteObject({
            Bucket: CONSTANT.CRMS_BUCKET,
            Key: `${company.companyUrl}/client/other/${context.result.filePath}`
        })

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const projectCheckAllowJoin = (options = {}) => {
    return async context => {
        if (context.params.notAllowedJoin && context.params.notAllowedJoin === 'true') return false
        else return true
    }
}

// eslint-disable-next-line no-unused-vars
export const projectUpdateQueries = (options = {}) => {
    return async context => {
        if (context.params.query.name) {
            context.params.query.name = { $iLike: `%${context.params.query.name}%` }
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const projectAddKeyJoin = (options = {}) => {
    return async context => {
        let keyJoin = ['locationName', 'resumeSuccessful', 'openJob']
        if (context.params.query.$sort) {
            context.params.sortJoin = {}
            keyJoin.map(condition => {
                let key = context.params.query.$sort[condition]
                if (key) {
                    context.params.sortJoin[condition] = context.params.query.$sort[condition]
                    delete context.params.query.$sort[condition]
                }
            })
        }
        if (context.params.query.notAllowedJoin) {
            context.params.notAllowedJoin = context.params.query.notAllowedJoin
            delete context.params.query.notAllowedJoin
        }
    }
}

// eslint-disable-next-line no-unused-vars
export const projectJoinSequelize = (options = {}) => {
    return async context => {
        if (!context.params.sequelize) context.params.sequelize = {}

        const sequelize = context.params.sequelize
        sequelize.raw = true
        sequelize.include = [{
            model: context.app.services['locations'].Model,
            as: 'locations',
            attributes: ['id', 'name']
        }]
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const accessLogByCompany = (options = {}) => {
    return async context => {
        context.params.query.companyId = context.params.rmsUser.companyId
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const projectAccessLogAddKeyJoin = (options = {}) => {
    return async context => {
        let keyJoin = ['userName']
        if (context.params.query.$sort) {
            context.params.sortJoin = {}
            keyJoin.map(condition => {
                let key = context.params.query.$sort[condition]
                if (key) {
                    if (key !== '1' && key !== '-1') throw new BadRequest('UNKNOWN_OPERATOR_SORT')
                    context.params.sortJoin[condition] = context.params.query.$sort[condition]
                    delete context.params.query.$sort[condition]
                }
            })
        }
    }
}

// eslint-disable-next-line no-unused-vars
export const projectAccessLogJoinSequelize = (options = {}) => {
    return async context => {
        if (!context.params.sequelize) context.params.sequelize = {}

        context.params.sequelize = {
            raw: true,
            include: [{
                model: context.app.services['users'].Model,
                as: 'users',
                attributes: [],
                include: [{
                    model: context.app.services['rms-users-info'].Model,
                    as: 'rmsUser',
                    where: {
                        companyId: context.params.rmsUser.companyId
                    },
                    attributes: ['id', 'firstName', 'lastName', 'signEmail']
                }]
            }]
        }
        if (context.params.sortJoin && context.params.sortJoin['userName'])
            context.params.sequelize.order = [[{ model: context.app.services['users'].Model, as: 'users' }, { model: context.app.services['rms-users-info'].Model, as: 'rmsUser' }, 'firstName', context.params.sortJoin['userName'] === '1' ? 'ASC' : 'DESC']]

        return context
    }
}
