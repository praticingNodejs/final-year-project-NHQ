/* eslint-disable no-unused-vars */
import { authenticate } from '@feathersjs/authentication'
import { iff, disallow, isProvider, preventChanges } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS))],
        find: [
            iff(
                isProvider('external'),
                apiHook.queryByFieldRms('companyId'),
                apiHook.paginateAcceptFalse(),
                apiHook.searchDocsByCompany()
            )
        ],
        get: [],
        create: [
            apiHook.validateEmptyField(['folderName']),
            apiHook.createNewTbb(),
            apiHook.checkDuplicateFolder()
        ],
        update: [disallow('external')],
        patch: [
            apiHook.multiCRUD(),
            // preventChanges(true, 'folderPath')
        ],
        remove: [apiHook.multiCRUD(), apiHook.findRms()]
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [
            iff(
                isProvider('external'),
                async context => {
                    if (!context.result.documentName && !context.result.documentPath && !context.result.documentOriginalFileName) {
                        const sequelize = await context.app.get('sequelizeClient')
                        await sequelize.query(`
                            DELETE FROM tbb_documents WHERE company_id = ${context.params.rmsUser.companyId} AND folder_path ~ '${context.result.folderPath}.*'
                        `)
                    }

                    return context
                }
            )
        ]
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
