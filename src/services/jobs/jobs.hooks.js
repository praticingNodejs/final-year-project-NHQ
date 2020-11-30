/* eslint-disable no-extra-boolean-cast */
import { authenticate } from '@feathersjs/authentication'

import {
    setNow,
    fastJoin,
    iff,
    isProvider,
    disallow
} from 'feathers-hooks-common'

import { NotAuthenticated } from '@feathersjs/errors'

import JwtDecode from 'jwt-decode'

import * as apiHook from '../../hooks'
import CONSTANT from '../../constant'

const externalJoin = {
    joins: {
        sector: (..._args) => async (job, context) => job.sector = job.sectorId ? await context.app.service('sectors').get(job.sectorId, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null,
        coowners: (..._args) => async (job, context) => job.coowners = await context.app.service('jobs/coowners').find({
            query: {
                jobId: job.id,
                $select: ['id', 'consultantId'],
                $sort: {
                    id: 1
                }
            },
            paginate: false
        }).catch(_e => { return null }),
        jobResume: (..._args) => async (job, context) => {
            const sequelize = await context.app.get('sequelizeClient')
            job.jobResume = await sequelize.query(`
                SELECT id
                    ,submitted_on as "submittedOn"
                    ,resume_id as "resumeId"
                FROM jobs_resume AS jr
                WHERE
                    jr.job_id = ${job.id}
                ORDER BY jr.submitted_on DESC
            `).then(result => {
                return result[0]
            }).catch(_e => {
                return null
            })
            job.lastSubmitted = job.jobResume?.length > 0 ? new Date(job.jobResume[job.jobResume?.length - 1].submittedOn).getTime() : null
        },
        in: (..._args) => async (job, context) => {
            const sequelize = await context.app.get('sequelizeClient')
            // duplicate due to nominate -> get approved = 1 and consultant_id = null
            job.in = await sequelize.query(`
                SELECT COUNT(*) FROM jobs_resume AS jr
                JOIN resume ON jr.resume_id = resume.id
                WHERE
                    jr.job_id=${job.id}  AND
                    -- resume.user_id IS NOT NULL AND
                    resume.company_id IS NOT NULL AND
                    resume.root_resume_id IS NOT NULL AND
                    jr.is_approved = 1 AND
                    jr.consultant_id IS NULL AND
                    jr.is_nominated = false
            `).then(result => {
                return parseInt(result[0][0].count, 10)
            }).catch(_e => {
                return null
            })
        },
        out: (..._args) => async (job, context) => {
            const sequelize = await context.app.get('sequelizeClient')
            job.out = await sequelize.query(`
                SELECT COUNT(*) FROM jobs_resume
                JOIN resume ON jobs_resume.resume_id = resume.id
                WHERE
                    jobs_resume."job_id"=${job.id} AND
                    resume.company_id IS NOT NULL AND
                    jobs_resume.is_nominated = true
            `).then(result => {
                return parseInt(result[0][0].count, 10)
            }).catch(_e => {
                return null
            })
        },
        flagType: (..._args) => async (job, context) => {
            const sequelize = await context.app.get('sequelizeClient')

            const redFlag = await sequelize.query(`
                SELECT COUNT(id) FROM jobs_resume WHERE job_id=${job.id} AND status IN (${CONSTANT.FLAG_STATUS.RED.join(',')})
            `).then(result => {
                return result[0][0].count
            }).catch(_e => {
                return 0
            })

            const blueFlag = await sequelize.query(`
                SELECT COUNT(id) FROM jobs_resume WHERE job_id=${job.id} AND status IN (${CONSTANT.FLAG_STATUS.BLUE.join(',')})
            `).then(result => {
                return result[0][0].count
            }).catch(_e => {
                return 0
            })

            const greyFlag = await sequelize.query(`
                SELECT COUNT(id) FROM jobs_resume WHERE job_id=${job.id} AND status IN (${CONSTANT.FLAG_STATUS.GREY.join(',')})
            `).then(result => {
                return result[0][0].count
            }).catch(_e => {
                return 0
            })

            job.flagType = {
                redFlag: parseInt(redFlag, 10),
                blueFlag: parseInt(blueFlag, 10),
                greyFlag: parseInt(greyFlag, 10)
            }
            return context
        },
        jobsResumeRemarks: (..._args) => async (job, context) => {
            const sequelize = await context.app.get('sequelizeClient')
            job.jobsResumeRemarks = await sequelize.query(`
                SELECT jrr.id
                FROM jobs_resume_remarks jrr
                JOIN jobs_resume jr ON jr.id = jrr.jobs_resume_id
                JOIN resume r ON r.id = jr.resume_id
                WHERE
                    jr.job_id = ${job.id}
                    AND jr.is_approved = 1
                ORDER BY jrr.created_at DESC
                LIMIT 10
            `).then(async result => {
                const listRemarkId = result[0].map(({ id }) => id)
                return await context.app.service('jobs/resume/remarks').find({
                    query:{
                        id: {
                            $in: listRemarkId
                        },
                        $limit: 10
                    },
                    paginate: false
                }).catch(_e => { return [] })
            }).catch(_err => {
                return null
            })
            return context
        }
    }
}

const commonJoin = {
    joins: {
        //*--------------- not join in find
        salaryCurrency: (..._args) => async (job, context) =>{
            if(context.method !== 'find')
                job.salaryCurrencyObj = job.salaryCurrency ? await context.app.service('currencies').get(job.salaryCurrency, {
                    query: {
                        $select: ['id', 'name']
                    }
                }).catch(_e => { return null }) : null
            return context
        },
        status: (..._args) => async (job, context) => {
            if(context.method !== 'find')
                job.status = job.statusId ? await context.app.service('job-statuses').get(job.statusId, {
                    query: {
                        $select: ['id', 'name']
                    }
                }).catch(_e => { return null }) : null
            return context
        },
        location: (..._args) => async (job, context) => {
            if(context.method !== 'find')
                job.location = job.locationId ? await context.app.service('locations/sub').get(job.locationId, {
                    query: {
                        $select: ['id', 'name']
                    }
                }).catch(_e => { return null }) : null
            return context
        },
        project: (..._args) => async (job, context) =>{
            if(context.method !== 'find')
                job.project = job.projectId ? await context.app.service('projects').get(job.projectId, {
                    query: {
                        $select: ['id', 'name', 'website', 'address1']
                    },
                }).catch(_e => { return null }) : null
            return context
        },
        //*---------------
        workCountry: (..._args) => async (job, context) => job.workCountryLocation = job.workCountry ? await context.app.service('locations').get(job.workCountry, {
            query: {
                $select: ['id', 'name', 'abbreviation']
            }
        }).catch(_e => { return null }) : null,
        company: (..._args) => async (job, context) => job.company = job.companyId ? await context.app.service('companies').get(job.companyId).catch(_e => { return null }) : null,
        isLaterView: (..._args) => async (job, context) => {
            let tokenDecode = null
            if (!!context.params.authentication) {
                try {
                    tokenDecode = context.params.authentication.accessToken ? JwtDecode(context.params.authentication.accessToken) : null
                } catch (e) {
                    throw new NotAuthenticated('INVALID_TOKEN')
                }
            }

            const tmp = tokenDecode || context.params.userId ? await context.app.service('jobs-later-views').findOne({
                query: {
                    userId: tokenDecode?.userId || context.params.userId,
                    jobId: job.id,
                    $select: ['id']
                }
            }).catch(_e => { return null }) : null

            job.laterView = tmp ? tmp : null
            job.isLaterView = tmp ? true : false
        },
        contactPerson: (..._args) => async (job, context) => job.contactPerson = job.contactPersonId ? await context.app.service('projects/contacts').get(job.contactPersonId).catch(_e => { return null }) : null
    }
}

const joinGetJob = {
    joins: {
        location: (..._args) => async (job, context) => job.location = job.locationId ? await context.app.service('locations/sub').get(job.locationId, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null,
        status: (..._args) => async (job, context) => job.status = job.statusId ? await context.app.service('job-statuses').get(job.statusId, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null,
        workCountry: (..._args) => async (job, context) => job.workCountryLocation = job.workCountry ? await context.app.service('locations').get(job.workCountry, {
            query: {
                $select: ['id', 'name', 'abbreviation']
            }
        }).catch(_e => { return null }) : null,
        nationality: (..._args) => async (job, context) => job.nationality = job.nationalityId ? await context.app.service('nationalities').get(job.nationalityId, {
            query: {
                $select: ['id', 'name']
            },
            paginate: false
        }).catch(_e => { return null }) : null,
        sectorFilters: (..._args) => async (job, context) => job.sectorFilters = await context.app.service('jobs/sectors/filter').find({
            query: {
                jobId: job.id,
            },
            paginate: false
        }).then(result => {
            return result.map(obj => {
                return {
                    id: obj.id,
                    sectorId: obj.sector.id,
                    name: obj.sector.name
                }
            })
        }).catch(_e => { return [] }),
        rank: (..._args) => async (job, context) => job.rank = job.rankId ? await context.app.service('ranks').get(job.rankId, {
            query: {
                $select: ['id', 'name']
            },
        }).catch(_e => { return null }) : null,
        samePosition: (..._args) => async (job, context) => {
            const sequelize = await context.app.get('sequelizeClient')
            const queryResumeId = await sequelize.query(`
                SELECT DISTINCT ON (resume_id) resume_id, job_id, jr.id FROM jobs_resume AS jr
                INNER JOIN resume ON resume.id = jr.resume_id
                INNER JOIN jobs job ON job.id = jr.job_id
                WHERE
                (
                    (
                        job."rankId" = (SELECT "rankId" FROM jobs WHERE id = ${job.id})
                        AND job."designationId" = (SELECT "designationId" FROM jobs WHERE id = ${job.id})
                        AND job."disciplineId" = (SELECT "disciplineId" FROM jobs WHERE id = ${job.id})
                    ) OR (
                        job.position iLike (SELECT position FROM jobs WHERE id = ${job.id})
                    )
                ) AND job.id != ${job.id}
                AND job."companyId" = ${job.companyId}
                AND (
                        (resume.root_resume_id is null AND resume.user_id is null AND resume.company_id = ${job.companyId}) -- crms
                    OR
                        (resume.root_resume_id is null AND resume.user_id is not null AND resume.company_id is null) -- js original
                    OR
                        (resume.root_resume_id is not null AND resume.user_id is not null AND resume.company_id = ${job.companyId} AND jr.is_approved = 1 AND consultant_id IS NOT NULL) -- cloned that is approved
                );
            `).then(result => {
                return result[0]
            }).catch(_e => { return [] })

            const listJobResumeId = queryResumeId.map(({ id }) => id)

            const jobsResume = await context.app.service('jobs/resume').find({
                query: {
                    id: {
                        $in: listJobResumeId
                    },
                    $select: ['id']
                },
                paginate: false
            }).catch(_e => { return [] })

            job.samePosition = jobsResume.length
        },
        skills: (..._args) => async (job, context) => job.skills = await context.app.service('jobs/skills').find({
            query: {
                jobId: job.id,
                $sort: {
                    id: 1
                }
            },
            paginate: false
        }).catch(_e => { return [] }),
        jobProjectContact: (..._args) => async (job, context) => job.jobProjectContact = await context.app.service('jobs/project-contacts').find({
            query: {
                jobId: job.id
            },
            paginate: false
        }).catch(_e => { return null }),
        discipline: (..._args) => async (job, context) => job.discipline = job.disciplineId ? await context.app.service('disciplines').get(job.disciplineId, {
            query: {
                $select: ['id', 'name']
            },
        }).catch(_e => { return null }) : null,
        designation: (..._args) => async (job, context) => job.designation = job.designationId ? await context.app.service('designations').get(job.designationId, {
            query: {
                $select: ['id', 'name']
            },
        }).catch(_e => { return null }) : null,
        education: (..._args) => async (job, context) => job.education = job.educationId ? await context.app.service('educations').get(job.educationId, {
            query: {
                $select: ['id', 'name']
            }
        }).catch(_e => { return null }) : null,
        educations: (..._args) => async (job, context) => job.educations = await context.app.service('jobs/educations').find({
            query: {
                jobId: job.id,
                $select: ['id', 'educationId']
            },
            paginate: false
        }).then(result => {
            return result.map(({ education }) => education)
        }).catch(_e => { return [] })
    }
}

export default {
    before: {
        all: [],
        find: [
            iff(
                isProvider('external'),
                // apiHook.validateHiringManager(),
                apiHook.jobsValidateByCompany(),
                apiHook.jobFilterFlag()
            ),
            apiHook.jobsAddKeyJoin(),
            apiHook.jobsJoinSequelize(),
            apiHook.sortJoin('filterList', { key: 'sectorName', as: 'sectors', model: 'sectors' }),
            apiHook.sortJoin('filterList', { key: 'salaryCurrency', as: 'currencies', model: 'currencies' }),
            apiHook.sortJoin('filterList', { key: 'projectName', as: 'project', model: 'projects' }),
            apiHook.sortJoin('filterList', { key: 'statusName', as: 'jobStatuses', model: 'job-statuses' }),
            apiHook.jobsFilterAssignedTo()
        ],
        get: [
            apiHook.queryTempUser(),
            iff(isProvider('external'), apiHook.jobsValidateByCompany())
        ],
        create: [
            iff(
                isProvider('external'),
                authenticate('jwt'),
                apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, CONSTANT.VALIDATE_ROLE_CRMS[0], CONSTANT.VALIDATE_ROLE_CRMS[1]),
                apiHook.createdBy()
            ),
            apiHook.validateEmptyField(['companyId']),
            apiHook.jobsCredits(),
            setNow('createdAt')
        ],
        update: [disallow('external')],
        patch: [
            iff(
                isProvider('external'),
                authenticate('jwt'),
                apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, CONSTANT.VALIDATE_ROLE_CRMS[0], CONSTANT.VALIDATE_ROLE_CRMS[1]),
                apiHook.validateJobDetailViewer(),
                apiHook.findJobsBeforePatch(),
                apiHook.updatedBy()
            ),
            setNow('updatedAt'),
        ],
        remove: [
            iff(isProvider('external'), authenticate('jwt'), apiHook.validateRole(...CONSTANT.VALIDATE_ROLE_ARMS, ...CONSTANT.VALIDATE_ROLE_CRMS), apiHook.validateJobDetailViewer()),
            apiHook.removeJob()
        ]
    },
    after: {
        all: [
            iff(
                isProvider('external'),
                fastJoin(externalJoin),
                apiHook.jobHistory()
            ),
            // iff(isProvider('server'), fastJoin(serverJoin)),
            fastJoin(commonJoin)
        ],
        find: [
            apiHook.sortField('sumInOut'),
            apiHook.sortField('lastSubmitted'),
            apiHook.resJoinObject({ name: 'sectors', as: 'sector' }, ['id', 'name']),
            apiHook.resJoinObject({ name: 'currencies', as: 'salaryCurrencyObj' }, ['id', 'name']),
            apiHook.resJoinObject({ name: 'project', as: 'project' }, ['id', 'name', 'website', 'address1']),
            apiHook.resJoinObject({ name: 'jobStatuses', as: 'status' }, ['id', 'name']),
            apiHook.resJoinObject({ name: 'nationalities', as: 'nationality' }, ['id', 'name']),
            apiHook.resJoinObject({ name: 'educations', as: 'education' }, ['id', 'name']),
            apiHook.resJoinObject({ name: 'workCountryLocation', as: 'workCountryLocation' }, ['id', 'name', 'abbreviation']),
            apiHook.resJoinObject({ name: 'locationsSub', as: 'location' }, ['id', 'name']),
            apiHook.totalHotJob(),
        ],
        get: [
            iff(
                isProvider('external'),
                apiHook.validateJobDetailViewer(),
                fastJoin(joinGetJob)
            )
        ],
        create: [
            apiHook.jobsFts(),
            apiHook.jobsCredits(),
            iff(isProvider('external'), apiHook.sendEmailRules()),
            async context => {
                if (Array.isArray(context.data.educations))
                    context.data.educations.map(educationId => {
                        context.app.service('jobs/educations').create({
                            jobId: context.result.id,
                            educationId
                        }).catch(_e => { return true })
                    })
            }
        ],
        update: [],
        patch: [
            apiHook.jobsFts(),
            iff(isProvider('external'), apiHook.sendEmailRules())
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
