// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import { NotAuthenticated } from '@feathersjs/errors'
import JwtDecode from 'jwt-decode'
import _ from 'lodash'

import CONSTANT from '../../../constant'

// eslint-disable-next-line no-unused-vars
export const queryByFieldRms = (options = {}) => {
    return async context => {
        if (context.type === 'before') {
            if (context.params.authentication?.accessToken) {
                let decodeToken
                try {
                    decodeToken = JwtDecode(context.params.authentication.accessToken)
                } catch (err) {
                    throw new NotAuthenticated('INVALID_TOKEN')
                }

                const user = await context.app.service('users').get(decodeToken.userId, {
                    query: {
                        $select: ['id', 'email']
                    }
                }).catch(_err => { throw new NotAuthenticated('USER_NOT_EXISTED') })

                if (_.intersection(user.role, CONSTANT.VALIDATE_ROLE_JS).length > 0) {
                    context.params.query[options] = null
                } else {
                    const rmsUser = await context.app.service('rms-users-info').findOne({
                        query: {
                            userId: decodeToken.userId,
                            $select: ['id', 'companyId']
                        }
                    }).catch(_e => { return null })

                    context.params.query[options] = _.intersection(rmsUser?.role, CONSTANT.VALIDATE_ROLE_ARMS).length > 0 ? null : rmsUser[options]
                }
            } else {
                context.params.query[options] = null
            }
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const searchFullNameRms = (options = {}) => {
    return async context => {
        if (context.params.query.fullName) {
            const fullName = context.params.query.fullName.split(' ')

            const queryFirstName = []
            const queryLastName = []
            for (let name of fullName) {
                queryFirstName.push({
                    firstName: {
                        $iLike: `%${name}%`
                    }
                })

                queryLastName.push({
                    lastName: {
                        $iLike: `%${name}%`
                    }
                })
            }

            context.params.query.$or = [{
                $or: queryFirstName
            }, {
                $or: queryLastName
            }]

            delete context.params.query.fullName
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const filterRole = (options = {}) => {
    return async context => {
        if (context.params.query.role) {
            const { role } = context.params.query
            delete context.params.query.role

            const userRole = await context.app.service('rms-users-info').find({
                query: {
                    companyId: context.params.query.companyId,
                    $sort: {
                        id: 1
                    },
                    $select: ['id', 'userId']
                },
                paginate: false
            }).then(result => {
                return result.filter(({ user }) => {
                    if (_.includes(user.role, role))
                        return user
                })
            })

            context.params.query.id = {
                $in: userRole.map(({ id }) => id)
            }
        }
    }
}
