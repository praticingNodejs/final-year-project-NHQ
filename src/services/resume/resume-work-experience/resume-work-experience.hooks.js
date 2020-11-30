import { authenticate } from '@feathersjs/authentication'
import { fastJoin, iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'

const resumeExperienceResolvers = {
    joins: {
        resumeId: (..._args) => async (resumeWorkExperience, context) => resumeWorkExperience.resume = resumeWorkExperience.resumeId ? await context.app.service('resume').get(resumeWorkExperience.resumeId).catch(_e => { return null }) : null
    }
}

export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [apiHook.multiCRUD()],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt')), apiHook.multiCRUD()],
        remove: [iff(isProvider('external'), authenticate('jwt'), apiHook.autoPatchCloneResumeService()), apiHook.multiCRUD()]
    },

    after: {
        all: [iff(isProvider('external'), fastJoin(resumeExperienceResolvers))],
        find: [],
        get: [],
        create: [iff(isProvider('external'), apiHook.autoPatchCloneResumeService())],
        update: [],
        patch: [iff(isProvider('external'), apiHook.autoPatchCloneResumeService())],
        remove: [iff(isProvider('external'), apiHook.autoPatchCloneResumeService())]
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
