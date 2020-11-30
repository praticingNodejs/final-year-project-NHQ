/* eslint-disable no-extra-boolean-cast */
import { authenticate } from '@feathersjs/authentication'
import { setNow, iff, isProvider, fastJoin, disallow } from 'feathers-hooks-common'

import JwtDecode from 'jwt-decode'
import { NotAuthenticated } from '@feathersjs/errors'

import * as apiHook from '../../../hooks'

const commonJoin = {
    joins: {
        consultant: (..._args) => async (jobsResume, context) => {
            if (jobsResume.consultantId) {
                jobsResume.consultant = await context.app.service('rms-users-info').findOne({
                    query: {
                        userId: jobsResume.consultantId,
                        $select: ['id', 'firstName', 'lastName']
                    }
                }).catch(_e => { return null })
            }
        },
        job: (..._args) => async (jobsResume, context) => {
            if (jobsResume.jobId) {
                let condition = {}
                if (context.params.authentication?.accessToken)
                    try {
                        const decodeToken = JwtDecode(context.params.authentication.accessToken)
                        condition = {
                            query: {
                                tempUserId: decodeToken?.userId
                            }
                        }
                    } catch (err) {
                        throw new NotAuthenticated('INVALID_TOKEN')
                    }
                jobsResume.job = await context.app.service('jobs').get(jobsResume.jobId, condition).catch(_e => { return null })
            }
        },
        resume: (..._args) => async (jobsResume, context) => {
            if (jobsResume.resumeId)
                jobsResume.resume = await context.app.service('resume').get(jobsResume.resumeId).catch(_e => { return null })
        }
    }
}

const jobsResumeExternal = {
    joins: {
        resume: (..._args) => async (jobsResume, context) => {
            if (jobsResume.resumeId) {
                let query = {}
                if (context.method === 'find') {
                    query.query = {
                        $select: [
                            'id', 'firstName', 'lastName', 'nationalityId', 'dob', 'residentialAddress', 'sgpResidentialStatus',
                            'expSalaryCurrency', 'expSalaryFreq', 'expSalaryAmount', 'expSalaryIsSgd', 'educationId', 'currentLocationId',
                            'companyId', 'updatedAt', 'originalResumeName', 'userId', 'gender', 'workExpTotal', 'rootResumeId', 'availability'
                        ]
                    }
                }
                jobsResume.resume = await context.app.service('resume').get(jobsResume.resumeId, query).catch(_e => { return null })
                if (jobsResume.resume?.companyId && context.params.rmsUser?.companyId && context.params.rmsUser.companyId !== jobsResume.resume.companyId) {
                    delete jobsResume.resume
                }

                return context
            }
        },
        job: (..._args) => async (jobsResume, context) => {
            jobsResume.job = jobsResume.jobId ? await context.app.service('jobs').get(jobsResume.jobId).catch(_e => { return null }) : null
            if (jobsResume.job?.companyId && context.params.rmsUser?.companyId && context.params.rmsUser.companyId === jobsResume.job.companyId) return context
            else delete jobsResume.resume
            return context
        },
        jobsResumeDocuments: (..._args) => async (jobsResume, context) => jobsResume.jobsResumeDocuments = await context.app.service('jobs/resume/documents').find({
            query: {
                jobsResumeId: jobsResume.id,
                $sort: {
                    createdAt: -1
                }
            },
            paginate: false
        }).catch(_e => { return [] }),
        jobsResumeAcknowledgements: (..._args) => async (jobsResume, context) => jobsResume.jobsResumeAcknowledgements = await context.app.service('jobs/resume/acknowledgements').find({
            query: {
                jobsResumeId: jobsResume.id,
                $sort: {
                    sentAt: -1
                }
            },
            paginate: false
        }).catch(_e => { return [] }),
        jobsResumeRemarks: (..._args) => async (jobsResume, context) => jobsResume.jobsResumeRemarks = await context.app.service('jobs/resume/remarks').find({
            query: {
                jobsResumeId: jobsResume.id,
                $sort: {
                    createdAt: -1
                }
            },
            paginate: false
        }).catch(_e => { return [] }),
        jobsResumeNotifications: (..._args) => async (jobsResume, context) => jobsResume.jobsResumeNotifications = await context.app.service('jobs/resume/notifications').find({
            query: {
                jobsResumeId: jobsResume.id,
                $sort: {
                    createdAt: -1
                }
            },
            paginate: false
        }).catch(_e => { return [] }),
        jobsResumeVisitorRemarks: (..._args) => async (jobsResume, context) => jobsResume.jobsResumeVisitorRemarks = await context.app.service('jobs/resume/visitor').find({
            query: {
                jobsResumeId: jobsResume.id,
                isSeen: false,
                $sort: {
                    createdAt: 1
                }
            },
            paginate: false
        }).catch(_e => { return [] }),
        jobsResumeInterview: (..._args) => async (jobsResume, context) => jobsResume.jobsResumeInterview = (await context.app.service('jobs/resume/interview').find({
            query: {
                jobsResumeId: jobsResume.id,
                $sort: {
                    createdAt: -1
                },
                $limit: 1
            },
            paginate: false
        }).catch(_e => { return [] }))
    }
}

export default {
    before: {
        all: [],
        find: [
            apiHook.paginateAcceptFalse(),
            apiHook.queryNotNull(['consultantId']),
            apiHook.joinStatusJobResume(),
            apiHook.fromDateToDate(),
            iff(
                isProvider('external'),
                apiHook.findRms(),
                // if has list in query, means the query are from the submitted resume
                apiHook.filterSubmittedResume(),
                apiHook.hotListColdList()
            )
        ],
        get: [
            iff(isProvider('external'), authenticate('jwt'))
        ],
        create: [
            iff(
                isProvider('external'),
                authenticate('jwt'),
                apiHook.validateEmptyField(['jobId', 'resumeId']),
                apiHook.checkCreatedJobResume(),
                apiHook.createdBy()
            ),
            setNow('submittedOn')
        ],
        update: [disallow('external')],
        patch: [
            iff(
                isProvider('external'),
                authenticate('jwt'),
                apiHook.updatedBy(),
                apiHook.findBeforeUpdate()
            ),
        ],
        remove: [
            iff(isProvider('external'), authenticate('jwt')),
            apiHook.removeJobsResume()
        ]
    },

    after: {
        all: [iff(isProvider('external'), fastJoin(jobsResumeExternal))],
        find: [
            fastJoin(commonJoin),
            iff(
                isProvider('external'),
                apiHook.hotListColdList(),
                // apiHook.filterSubmittedResume(),
                apiHook.findDuplicateResumeCrms()
            )
        ],
        get: [
            iff(isProvider('external'), apiHook.createJobsResumeVisitor()),
            fastJoin(commonJoin)
        ],
        create: [
            iff(isProvider('external'), apiHook.cloneResume())
        ],
        update: [],
        patch: [
            iff(
                isProvider('external'),
                fastJoin(commonJoin),
                apiHook.remarkJobsResumeStatus(),
                apiHook.updateJobStatus(),
                apiHook.sendEmailRules()
            )
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
