import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, fastJoin, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../../hooks'
import CONSTANT from '../../../../constant'

const joinRanks = {
    joins: {
        rank: (..._args) => async (companyRank, context) => {
            let rank = await context.app.service('ranks').get(companyRank.rankId, {
                query: {
                    $select: ['id', 'name', 'status', 'companyId', 'addedByCRMS']
                }
            }).catch(_e => { return null })

            companyRank.id = rank?.id
            companyRank.name = rank?.name
            companyRank.companyId = rank?.companyId
            companyRank.addedByCRMS = rank?.addedByCRMS
        }
    }
}

export default {
    before: {
        all: [],
        find: [async context => {
            let keyJoin = ['name']
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
        }, iff(isProvider('external'), iff(authenticate('jwt'), apiHook.companiesCommonTools()))],
        get: [disallow('external')],
        create: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS)), apiHook.validateEmptyField(['rankId', 'companyId'])],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.crmsMultiPatchTools())],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.multiCRUD())]
    },

    after: {
        all: [iff(isProvider('external'), fastJoin(joinRanks))],
        find: [iff(isProvider('external'), apiHook.companiesCommonTools('ranks')), apiHook.sortCompaniesTools()],
        get: [],
        create: [],
        update: [],
        patch: [],
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
