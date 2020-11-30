import { authenticate } from '@feathersjs/authentication'
import { setNow, fastJoin, iff, isProvider, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../hooks'
import CONSTANT from '../../constant'

const projectResolvers = {
    joins: {
        openJob: (..._args) => async (project, context) => {
            let openJobs = await context.app.service('jobs').find({
                query: {
                    projectId: project.id,
                    statusId: 239,
                    $select: ['id']
                },
                paginate: false
            }).catch(_e => { return [] })
            project.openJob = openJobs.length
        },
        resumeSuccessful: (..._args) => async (project, context) => {
            let totalSuccessResume = await context.app.service('jobs/resume').find({
                query: {
                    isApproved: 1,
                    $select: ['id']
                },
                sequelize: {
                    raw: true,
                    include: [{
                        model: context.app.services['jobs'].Model,
                        as: 'jobs',
                        where: {
                            projectId: project.id,
                            $or: [{
                                statusId: 239 // OPEN
                            }, {
                                statusId: 240 // CLOSE
                            }]
                        },
                        attributes: []
                    }]
                },
                paginate: false
            }).catch(_e => { return null })
            project.resumeSuccessful = totalSuccessResume?.length
        },
        documents: (..._args) => async (project, context) => project.documents = await context.app.service('projects/documents').find({
            query: {
                projectId: project.id,
                $select: ['id', 'name', 'filePath']
            },
            paginate: false
        }).catch(_e => { return null }),
        contacts: (..._args) => async (project, context) => project.contacts = await context.app.service('projects/contacts').find({
            query: {
                projectId: project.id,
                // $select: ['id', 'projectId', 'name', 'email', 'designation', 'did', 'mobile']
            },
            paginate: false
        }).catch(_e => { return null }),
        location: (..._args) => async (project, context) => project.location = project.locationId ? await context.app.service('locations').get(project.locationId, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null,
    }
}

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS))],
        find: [
            apiHook.paginateAcceptFalse(),
            apiHook.projectUpdateQueries(),
            apiHook.projectAddKeyJoin(),
            apiHook.projectJoinSequelize(),
            apiHook.sortJoin('filterList', { key: 'locationName', as: 'locations', model: 'locations' })],
        get: [],
        create: [apiHook.createdBy()],
        update: [disallow('external')],
        patch: [apiHook.updatedBy(), setNow('updatedAt')],
        remove: []
    },

    after: {
        all: [
            iff(apiHook.projectCheckAllowJoin(), iff(isProvider('external'), fastJoin(projectResolvers)))
        ],
        find: [apiHook.sortField('openJob'), apiHook.sortField('resumeSuccessful'), apiHook.resJoinObject({ name: 'locations', as: 'location' }, ['id', 'name'])],
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
