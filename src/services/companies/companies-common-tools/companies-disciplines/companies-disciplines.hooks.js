import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, fastJoin, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../../hooks'
import CONSTANT from '../../../../constant'

const disciplinesResolver = {
    joins: {
        discipline: (..._args) => async (companiesDisciplines, context) => {
            let discipline = await context.app.service('disciplines').get(companiesDisciplines.disciplineId, {
                query: {
                    $select: ['id', 'name', 'status', 'companyId', 'addedByCRMS']
                }
            }).catch(_e => { return null })

            companiesDisciplines.id = discipline?.id
            companiesDisciplines.name = discipline?.name
            companiesDisciplines.companyId = discipline?.companyId
            companiesDisciplines.addedByCRMS = discipline?.addedByCRMS
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
        create: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS)), apiHook.validateEmptyField(['disciplineId', 'companyId'])],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.crmsMultiPatchTools())],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.multiCRUD())]
    },

    after: {
        all: [iff(isProvider('external'), fastJoin(disciplinesResolver))],
        find: [iff(isProvider('external'), apiHook.companiesCommonTools('disciplines')), apiHook.sortCompaniesTools()],
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
