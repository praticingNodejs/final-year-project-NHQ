import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, fastJoin, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../../hooks'
import CONSTANT from '../../../../constant'

const designationResolver = {
    joins: {
        designation: (..._args) => async (companyDesignation, context) => {
            let designation = await context.app.service('designations').get(companyDesignation.designationId, {
                query: {
                    $select: ['id', 'name', 'status', 'companyId', 'addedByCRMS']
                }
            }).catch(_e => { return null })

            companyDesignation.id = designation?.id
            companyDesignation.name = designation?.name
            companyDesignation.companyId = designation?.companyId
            companyDesignation.addedByCRMS = designation?.addedByCRMS
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
        get: [],
        create: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS)), apiHook.validateEmptyField(['designationId', 'companyId'])],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.crmsMultiPatchTools())],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.multiCRUD())]
    },

    after: {
        all: [fastJoin(designationResolver)],
        find: [iff(isProvider('external'), apiHook.companiesCommonTools('designations')), apiHook.sortCompaniesTools()],
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
