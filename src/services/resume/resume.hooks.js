import { authenticate } from '@feathersjs/authentication'
import { setNow, fastJoin, iff, isProvider, disallow } from 'feathers-hooks-common'
import { hooks as authHooks } from '@feathersjs/authentication-local'

import * as apiHook from '../../hooks'
import CONSTANT from '../../constant'

const { protect } = authHooks

const commonJoin = {
    joins: {
        company: (..._args) => async (resume, context) => resume.company = resume.companyId ? await context.app.service('companies').get(resume.companyId, {
            query: {
                $select: ['id', 'name', 'website', 'companyUrl', 'website']
            }
        }).catch(_e => { return null }) : null,
        designation: (..._args) => async (resume, context) => {
            resume.designation = resume.roleId ? await context.app.service('designations').get(resume.roleId, {
                query: {
                    $select: ['id', 'name']
                },
            }).catch(_e => { return null }) : null
            resume.designationId = resume.roleId
        },
        contacts: (..._args) => async (resume, context) => resume.contacts = await context.app.service('resume/contacts').find({
            query: {
                resumeId: resume.id,
                $select: ['id', 'category', 'value'],
                $sort: {
                    id: 1
                }
            },
            paginate: false
        }).catch(_e => { return null }),
        messengers: (..._args) => async (resume, context) => resume.messengers = await context.app.service('resume/messengers').find({
            query: {
                resumeId: resume.id,
                $select: ['id', 'messengerType', 'messengerAccount'],
                $sort: {
                    id: 1
                }
            },
            paginate: false
        }).catch(_e => { return null }),
        sectors: (..._args) => async (resume, context) => resume.sectors = await context.app.service('resume/sectors').find({
            query: {
                resumeId: resume.id,
                $select: ['id', 'sectorId']
            },
            paginate: false
        }).then(result => {
            return result.map(obj => {
                obj.sector.resumeSectorId = obj.id
                return obj.sector
            })
        }).catch(_e => { return null }),
        discipline: (..._args) => async (resume, context) => resume.discipline = resume.disciplineId ? await context.app.service('disciplines').get(resume.disciplineId).catch(_e => { return null }) : null,
        currentLocation: (..._args) => async (resume, context) => resume.currentLocation = resume.currentLocationId ? await context.app.service('locations').get(resume.currentLocationId, {
            query: {
                $select: ['id', 'name', 'abbreviation']
            }
        }).catch(_e => { return null }) : null,
        nationality: (..._args) => async (resume, context) => resume.nationality = resume.nationalityId ? await context.app.service('nationalities').get(resume.nationalityId, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null,
        workExperience: (..._args) => async (resume, context) => resume.workExperience = await context.app.service('resume/work-experience').find({
            query: {
                resumeId: resume.id,
                $select: ['id', 'periodFrom', 'periodTo', 'presentDate', 'company', 'division', 'divisionApplicable', 'position', 'duties', 'countInRelatedExp'],
                $sort: {
                    periodTo: -1
                }
            },
            paginate: false
        }).catch(_e => { return [] }),
        salaryCurrency: (..._args) => async (resume, context) => resume.salaryCurrencyObj = resume.salaryCurrency ? await context.app.service('currencies').findOne({
            query: {
                id: resume.salaryCurrency,
                $select: ['id', 'name', 'status']
            }
        }).catch(_e => { return null }) : null,
        expSalaryCurrency: (..._args) => async (resume, context) => resume.expSalaryCurrencyObj = resume.expSalaryCurrency ? await context.app.service('currencies').get(resume.expSalaryCurrency, {
            query: {
                $select: ['id', 'name', 'status']
            }
        }).catch(_e => { return null }) : null,
        rank: (..._args) => async (resume, context) => resume.rank = resume.rankId ? await context.app.service('ranks').get(resume.rankId, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null,
        updatedBy: (..._args) => async (resume, context) => resume.updatedBy = resume.updatedBy ? await context.app.service('users').get(resume.updatedBy, {
            query: {
                $select: ['id', 'email']
            }
        }).catch(_e => { return null }) : null,
        otherDocuments: (..._args) => async (resume, context) => resume.otherDocuments = await context.app.service('resume/documents').find({
            query: {
                resumeId: resume.id
            },
            paginate: false
        }).catch(_e => { return [] }),
        education: (..._args) => async (resume, context) => resume.education = resume.educationId ? await context.app.service('educations').get(resume.educationId, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null,
        user: (..._args) => async (resume, context) => resume.user = resume.userId ? await context.app.service('users').get(resume.userId, {
            query: {
                $select: ['id', 'email']
            }
        }).then(result => {
            return result.email.match(CONSTANT.REGEX.EMAIL) ? result : {
                ...result,
                email: null
            }
        }).catch(_e => { return null }) : null
    }
}

const joinGetResume = {
    joins: {
        user: (..._args) => async (resume, context) => resume.user = resume.userId ? await context.app.service('users').get(resume.userId, {
            query: {
                $select: ['id', 'email']
            }
        }).then(result => {
            return result.email.match(CONSTANT.REGEX.EMAIL) ? result : {
                ...result,
                email: null
            }
        }).catch(_e => { return null }) : null,
        sgpResidentialStatus: (..._args) => async (resume, context) => resume.residentialStatus = resume.sgpResidentialStatus ? await context.app.service('sgp-residential-status').get(resume.sgpResidentialStatus, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null
    }
}

export default {
    before: {
        all: [],
        find: [
            apiHook.findRms(),
            apiHook.queryNull(['companyId']),
            apiHook.resumeAddKeyJoin(),
            apiHook.resumeJoinSequelize(),
            apiHook.sortJoin('filterList', { key: 'educationName', as: 'education', model: 'educations' }), // key sort defined in sortJoin || as - alias
            apiHook.sortJoin('filterList', { key: 'residentialStatusName', as: 'residentialStatus', model: 'sgp-residential-status' }), // model defined by alias,
            apiHook.validateResumeViewer(),
            apiHook.searchFullNameRms(),
            iff(isProvider('external'), apiHook.armsViewResume())
        ],
        get: [apiHook.findRms()],
        create: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.resumeCreateByRms()),
            apiHook.resumeDesignationToRole(),
            apiHook.validateEmptyField(['firstName', 'lastName', 'nationalityId', 'sgpResidentialStatus', 'currentLocationId']),
            setNow('acceptTermDate')
        ],
        update: [disallow('external')],
        patch: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.updatedBy(), apiHook.resumeEditReason()),
            apiHook.resumeDesignationToRole(),
            setNow('updatedAt')
        ],
        remove: [
            iff(isProvider('external'), authenticate('jwt')),
            apiHook.removeResume()
        ]
    },

    after: {
        all: [
            // iff(isProvider('server'), fastJoin(serverJoin)),
            fastJoin(commonJoin),
            protect('ftsStripSearch')
        ],
        find: [
            // apiHook.resJoinObject({ name: 'users', as: 'user' }, ['id', 'email']),
            apiHook.resJoinObject({ name: 'residentialStatus', as: 'residentialStatus' }, ['id', 'name']),
            apiHook.resJoinObject({ name: 'education', as: 'education' }, ['id', 'name']),
            apiHook.resumeMapDuplicate()
        ],
        get: [
            fastJoin(joinGetResume),
            apiHook.validateResumeViewer()
        ],
        create: [apiHook.resumeFts()],
        update: [],
        patch: [
            apiHook.resumeFts(),
            iff(isProvider('external'), apiHook.autoPatchCloneResume())
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
