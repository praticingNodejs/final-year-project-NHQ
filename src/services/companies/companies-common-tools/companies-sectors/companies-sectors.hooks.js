import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, disallow, fastJoin } from 'feathers-hooks-common'

import * as apiHook from '../../../../hooks'
import CONSTANT from '../../../../constant'

const sectorsResolver = {
    joins: {
        sector: (..._args) => async (companySectors, context) => {
            let sector = await context.app.service('sectors').get(companySectors.sectorId, {
                query: {
                    $select: ['id', 'name', 'status', 'companyId', 'addedByCRMS']
                }
            }).catch(_e => { return null })

            companySectors.id = sector?.id
            companySectors.name = sector?.name
            companySectors.companyId = sector?.companyId
            companySectors.addedByCRMS = sector?.addedByCRMS
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
        create: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS)), apiHook.validateEmptyField(['sectorId', 'companyId'])],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.crmsMultiPatchTools())],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS))]
    },

    after: {
        all: [iff(isProvider('external'), fastJoin(sectorsResolver))],
        find: [iff(isProvider('external'), apiHook.companiesCommonTools('sectors')), apiHook.sortCompaniesTools()],
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
