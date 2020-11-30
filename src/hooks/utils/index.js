/* eslint-disable no-prototype-builtins */
// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import _ from 'lodash'
import { NotAcceptable, BadRequest, GeneralError, NotAuthenticated, Forbidden } from '@feathersjs/errors'

import CONSTANT from '../../constant'

// eslint-disable-next-line no-unused-vars
export const paginateAcceptFalse = (options = {}) => {
    return async context => {
        if (context.params.query)
            if (context.params.query.$limit === '-1') {
                context.params.paginate = false
                delete context.params.query.$limit
            }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const queryNull = (options = []) => {
    return async context => {
        options.map(field => {
            if (context.params.query[field] === 'null')
                context.params.query[field] = null
        })
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const queryNotNull = (options = []) => {
    return async context => {
        options.map(field => {
            if (context.params.query[field] === 'null')
                context.params.query[field] = { $ne: null }
        })
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const multiCRUD = (options = {}) => {
    return async context => {
        if (context.method === 'patch' || context.method === 'update')
            if (!context.id && !Array.isArray(context.data))
                throw new BadRequest('INVALID_REQUEST')

        if (Array.isArray(context.data)) {
            if (context.data.length === 0) {
                context.result = []
                return context
            } else {
                switch (context.method) {
                    case 'create':
                        context.data.map(async (e, i) => {
                            context.app.service(context.path).create(e)
                            if (context.data.length === i + 1) context.result = context.data
                        })
                        return context
                    case 'patch': {
                        let result = []
                        const patch = await context.data.map(async (e) => {
                            if (!e.hasOwnProperty('id')) throw new NotAcceptable('MISSING_REQUIRED_FIELD')
                            let id = e.id
                            delete e.id
                            await context.app.service(context.path).patch(id, e).then(r => {
                                result.push(r)
                                return r
                            }).catch(_e => { return true })
                        })
                        Promise.all(patch)
                        context.result = result
                        return context
                    }
                }
            }
        }

        if (context.method === 'remove' && !context.id) {
            if (Object.keys(context.params.query).length === 0) {
                throw new BadRequest('MISSING_REQUIRED_FIELD')
            } else {
                return context
            }
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const resJoinObject = (options = {}, field = []) => {
    return async context => {
        let arrayData = context.result.data ? context.result.data : [context.result]
        arrayData.map(obj => {
            obj[options.as] = {}
            field.forEach(e => {
                obj[options.as][e] = obj[`${options.name}.${e}`]
                delete obj[`${options.name}.${e}`]
            })
        })
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const sortJoin = (options = {}, condition = {}) => {
    return async context => {
        switch (options) {
            case 'filterList':
                if (context.params.sortJoin && context.params.sortJoin[condition.key]) {
                    let sortType
                    switch (context.params.sortJoin[condition.key]) {
                        case '1':
                            sortType = 'ASC'
                            break
                        case '-1':
                            sortType = 'DESC'
                            break
                        default:
                            throw new BadRequest('UNKNOWN_OPERATOR_SORT')
                    }
                    context.params.sequelize.order = [[
                        { model: context.app.services[condition.model].Model, as: condition.as }, 'name', sortType
                    ]]
                }
                break
            default:
                throw new GeneralError('UNKNOWN_OPERATOR_SORT')
        }
    }
}

/**
 * Validate hook
 */
// eslint-disable-next-line no-unused-vars
export const findBeforeUpdate = (options = {}) => {
    return async context => {
        context.params.service = await context.app.service(context.path).get(context.id)
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const validateEmptyField = (options = []) => {
    return async context => {
        if (!Array.isArray(options)) throw new GeneralError('WRONG_EXPECTED_TYPE')

        if (Array.isArray(context.data)) {
            for (let i = 0; i < context.data.length; i++)
                for (let field of options)
                    if (!context.data[i].hasOwnProperty(field)) throw new NotAcceptable('MISSING_REQUIRED_FIELD')
        } else
            for (let field of options)
                if (!context.data.hasOwnProperty(field)) throw new NotAcceptable('MISSING_REQUIRED_FIELD')
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const validateLoginPortal = (options = {}) => {
    return async context => {
        if (context.data.strategy === 'local' || context.data.strategy === 'aspMembership') {
            let currentUserRole = context.params.user?.role
            let armsRole = CONSTANT.VALIDATE_ROLE_ARMS
            let crmsRole = CONSTANT.VALIDATE_ROLE_CRMS
            let jobSeekerRole = CONSTANT.VALIDATE_ROLE_JS

            let checkRole = []
            switch (context.data.portal) {
                case 'jobportal':
                    checkRole = _.intersection(currentUserRole, jobSeekerRole)
                    if (checkRole.length < 1) throw new Forbidden('ROLE_NOT_ALLOWED')
                    break
                case 'crms':
                    checkRole = _.intersection(currentUserRole, crmsRole)
                    if (checkRole.length < 1) throw new Forbidden('ROLE_NOT_ALLOWED')
                    break
                case 'arms':
                    checkRole = _.intersection(currentUserRole, armsRole)
                    if (checkRole.length < 1) throw new Forbidden('ROLE_NOT_ALLOWED')
                    break
                default:
                    throw new NotAuthenticated('INVALID_PORTAL')
            }
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const validateRole = (...roles) => {
    return async context => {
        let currentUserRole = []

        if (context.params.authentication) {
            let currentUserId = context.params.authentication.payload.userId
            let accessToken = context.params.authentication.accessToken
            let databaseToken = await context.app.service('users').get(currentUserId).then(payload => payload.passwordToken).catch(_err => {
                throw new NotAuthenticated('USER_NOT_EXISTED')
            })
            if (databaseToken !== accessToken) throw new NotAuthenticated('TOKEN_EXPIRED')
        }

        if (context.params.user) {
            currentUserRole = (await context.app.service('users/system-roles').find({
                query: {
                    userId: context.params.user.id,
                    $select: ['userId', 'systemRoleId']
                },
            })).data.map(r => r.role)
        } else {
            throw new NotAuthenticated('NOT_AUTHENTICATED')
        }

        if (roles.length > 0) {
            let checkRole = _.intersection(currentUserRole, roles)
            if (checkRole.length < 1) throw new Forbidden('ROLE_NOT_ALLOWED')
        }

        return context
    }
}
