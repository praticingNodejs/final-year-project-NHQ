import { authenticate } from '@feathersjs/authentication'
import { setNow, fastJoin, iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../hooks'
import CONSTANT from '../../constant'

const companiesResolvers = {
    joins: {
        messengers: (..._args) => async (companies, context) => companies.country = companies.country ? await context.app.service('locations').get(companies.country, {
            query: {
                $select: ['id', 'name', 'abbreviation']
            },
        }).catch(_e => { return null }) : null,
        totalUsers: (..._args) => async (companies, context) => {
            const sequelize = context.app.get('sequelizeClient')
            companies.totalUsers = parseInt(await sequelize.query(`SELECT COUNT(*) FROM rms_users_info WHERE company_id=${companies.id}`).then(result => {
                return result[0][0].count
            }).catch(_e => { return 0 }), 10)
        },
        credit: (..._args) => async (companies, context) => {
            let credit = await context.app.service('jobs/credits').findOne({
                query: {
                    companyId: companies.id
                }
            }).catch(_e => { return null })

            companies.credit = {
                id: credit?.id,
                creditLeft: credit?.creditPoints - credit?.creditUsages,
                creditPoints: credit?.creditPoints
            }
        },
        primaryUser: (..._args) => async (companies, context) => companies.primaryUser = companies.primaryUserId ? await context.app.service('users').findOne({
            query: {
                id: companies.primaryUserId,
                $select: ['id', 'email']
            }
        }).catch(_e => { return null }) : null
    }
}

export default {
    before: {
        all: [],
        find: [
            apiHook.paginateAcceptFalse(),
            apiHook.sortTotalUser(),
            apiHook.queryFullNameCompanies(),
            apiHook.queryByEmailPrimaryUser()
        ],
        get: [],
        create: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS), apiHook.validateEmptyField(['name', 'website'])),
            setNow('createdAt')
        ],
        update: [disallow('external')],
        patch: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.updatedBy()),
            setNow('updatedAt')
        ],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS))]
    },

    after: {
        all: [iff(isProvider('external'), fastJoin(companiesResolvers))],
        find: [
            apiHook.countTotalRmsUser(),
            apiHook.sortTotalRmsUser()
        ],
        get: [],
        create: [
            apiHook.companiesCredit(),
            apiHook.setCompanyS3Url()
        ],
        update: [],
        patch: [
            apiHook.companiesActive()
        ],
        remove: []
    },

    error: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
    }
}
