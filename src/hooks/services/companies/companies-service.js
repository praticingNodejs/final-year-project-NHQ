import { BadRequest } from '@feathersjs/errors'
import moment from 'moment-timezone'
import _ from 'lodash'

import CONSTANT from '../../../constant'
import { dynamicSort, filterSpecialCharacters } from '../../../utils'

// eslint-disable-next-line no-unused-vars
export const sortTotalUser = (options = {}) => {
    return async context => {
        if (context.params.query.$sort?.totalUsers) {
            context.params.sortJoin['totalUsers'] = context.params.query.$sort.totalUsers
            delete context.params.query.$sort.totalUsers
        }
    }
}

// eslint-disable-next-line no-unused-vars
export const queryFullNameCompanies = (options = {}) => {
    return async context => {
        if (context.params?.query.name) {
            context.params.query.name = {
                $iLike: `%${context.params.query.name}%`
            }
        }
    }
}

// eslint-disable-next-line no-unused-vars
export const queryByEmailPrimaryUser = (options = {}) => {
    return async context => {
        if (context.params.query.email) {
            const { email } = context.params.query
            context.params.email = email

            const users = await context.app.service('users').find({
                query: {
                    email: {
                        $iLike: `%${context.params.query.email}%`,
                    },
                    $select: ['id', 'email']
                },
                paginate: false
            }).then(result => {
                return result.filter(({ role }) => {
                    return _.includes(role, CONSTANT.VALIDATE_ROLE_CRMS[0])
                })
            }).then(result => {
                return result.map(({ id }) => id)
            }).catch(_e => { return [] })

            context.params.query.primaryUserId = {
                $in: users
            }

            delete context.params.query.email
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const setCompanyS3Url = (options = {}) => {
    return async context => {
        context.app.service('companies').patch(context.result.id, {
            companyUrl: context.result.id
        })
        context.result.companyUrl = context.result.id

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const countTotalRmsUser = (options = {}) => {
    return async context => {
        const sequelize = context.app.get('sequelizeClient')
        let query = CONSTANT.QUERY_WHERE, condition = ''
        if (context.params.query.name) {
            query += condition + `name iLike '%${context.params.query.name?.$iLike || context.params.query.name}%'`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.status) {
            query += condition + `status = ${filterSpecialCharacters(context.params.query.status)}`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.country) {
            query += condition + `country = '${filterSpecialCharacters(context.params.query.country)}'`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.isCRMSSubscribed) {
            query += condition + `is_crms_subscribed = ${filterSpecialCharacters(context.params.query.isCRMSSubscribed)}`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.isResumeSearchSubscribed) {
            query += condition + `is_resume_search_subscribed = ${filterSpecialCharacters(context.params.query.isResumeSearchSubscribed)}`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.isFeatured) {
            query += condition + `is_featured = ${filterSpecialCharacters(context.params.query.isFeatured)}`
            condition += CONSTANT.QUERY_AND
        }

        if (context.params.query.primaryUserId && context.params.query.primaryUserId && Array.isArray(context.params.query.primaryUserId.$in)) {
            query += condition + `primary_user_id IN ('${context.params.query.primaryUserId.$in.join('\',\'')}')`
            condition += CONSTANT.QUERY_AND
        }

        if (query === CONSTANT.QUERY_WHERE) query = ''
        const totalCompany = await sequelize.query(`
            SELECT id FROM companies ${query}
        `).then(result => {
            return result[0].map(({ id }) => id)
        })

        let countTotal = ''
        if (totalCompany) countTotal += ` WHERE company_id IN (${totalCompany})`
        context.result.totalRmsUsers = parseInt(await sequelize.query(`SELECT COUNT(*) FROM rms_users_info ${countTotal}`).then(result => {
            return result[0][0].count
        }).catch(_e => { return 0 }), 10)
    }
}

// eslint-disable-next-line no-unused-vars
export const sortTotalRmsUser = (options = {}) => {
    return async context => {
        if (context.params.sortJoin?.totalUsers && Array.isArray(context.result)) {
            context.result = context.result.sort(dynamicSort(`totalUsers${context.params.sortJoin === '1' ? '' : '-'}`))
        }
    }
}

// eslint-disable-next-line no-unused-vars
export const companiesActive = (options = {}) => {
    return async context => {
        const companies = await context.app.service('companies').get(context.id).catch(_err => {
            throw new BadRequest('COMPANY_NOT_EXISTED')
        })

        const dateMoment = moment(new Date()).format('YYYY-MM-DD')

        if (context.data.status === 1) {
            if (companies.subscriptionEndDate < dateMoment) {
                if (!context.data.subscriptionEndDate || context.data.subscriptionEndDate < dateMoment) {
                    throw new BadRequest('RENEW_SUBSCRIPTION_IS_REQUIRED')
                }
            }
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const companiesCredit = (options = {}) => {
    return async context => {
        context.app.service('jobs/credits').create({
            companyId: context.result.id
        })
        return context
    }
}
