import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, fastJoin, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

const jobResolvers = {
    joins: {
        education: (..._args) => async (jobEducation, context) => {
            jobEducation.education = jobEducation.educationId ? await context.app.service('educations').findOne({
                query: {
                    id: jobEducation.educationId,
                    $select: ['id', 'name']
                },
                paginate: false
            }).catch(_e => { return null }) : null
        },
    }
}

export default {
    before: {
        all: [],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS)), apiHook.multiCRUD()],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS))],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS)), apiHook.multiCRUD()]
    },

    after: {
        all: [],
        find: [fastJoin(jobResolvers)],
        get: [fastJoin(jobResolvers)],
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
