import { authenticate } from '@feathersjs/authentication'
import { fastJoin, iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'
import CONSTANT from '../../../constant'

const jobsProjectContactsResolver = {
    joins: {
        job: (..._args) => async (jobsProjectContacts, context) => jobsProjectContacts.job = await context.app.service('jobs').get(jobsProjectContacts.jobId, {
            query: {
                $select: ['id']
            }
        }).catch(_e => { return null }),
    }
}

const joinsProject = {
    joins: {
        projectContact: (..._args) => async (jobsProjectContacts, context) => jobsProjectContacts.projectContact = await context.app.service('projects/contacts').get(jobsProjectContacts.projectContactId).catch(_e => { return null })
    }
}

export default {
    before: {
        all: [],
        find: [apiHook.paginateAcceptFalse()],
        get: [],
        create: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.multiCRUD())],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS))],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.multiCRUD())]
    },

    after: {
        all: [iff(isProvider('external'), fastJoin(jobsProjectContactsResolver)), fastJoin(joinsProject)],
        find: [],
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
