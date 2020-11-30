// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import JwtDecode from 'jwt-decode'
import { BadRequest } from '@feathersjs/errors'
import axios from 'axios'

import CONSTANT from '../../../constant'

// eslint-disable-next-line no-unused-vars
export const checkCreatedJobResume = (options = {}) => {
    return async context => {
        /**
         * Check existed rms-resume (which is link to rooted resume)
         */
        const job = await context.app.service('jobs').get(context.data.jobId, {
            query: {
                $select: ['id', 'companyId']
            }
        }).catch(_e => { throw new BadRequest('JOB_NOT_EXISTED') })
        const resume = await context.app.service('resume').get(context.data.resumeId).catch(_e => { throw new BadRequest('RESUME_NOT_EXISTED') })
        const isBrandedFormat = job.company && job.company.isBrandedFormat ? true : false

        let resumePdfPath
        if (isBrandedFormat) {
            await axios.get(`${process.env.API_URL}/resume/branded-format-jobs-resume?resumeId=${resume.id}&jobId=${job.id}`, {
                headers: {
                    Authorization: `Bearer ${context.params.authentication.accessToken}`
                }
            }).then(({ data }) => {
                resumePdfPath = data.state ? data.resume.resumePdfPath : null
            }).catch(_err => { return true })
        }

        context.data.resumePdfPath = isBrandedFormat ? resumePdfPath : resume.resumePath
        context.data.resumeName = isBrandedFormat ? CONSTANT.RESUME_BRANDED_FORMAT_NAME(resume) : resume.originalResumeName

        const rmsResume = await context.app.service('resume').findOne({
            query: {
                rootResumeId: context.data.resumeId,
                userId: resume?.userId,
                companyId: job?.companyId,
                $select: ['id']
            }
        })

        if (context.data.consultantId) {
            context.data.isNominated = true
        }

        context.params.isExistRmsResume = rmsResume ? true : false // check exist: true -> not clone // false -> clone
        context.params.job = job
        context.params.resume = resume
        context.params.rmsResume = rmsResume

        if (resume.companyId) { // if exist resume company (rmsResume) will not clone
            context.params.isExistRmsResume = true
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const removeJobsResume = (options = {}) => {
    return async context => {
        await context.app.service('jobs/resume/acknowledgements').remove(null, {
            query: {
                jobsResumeId: context.id
            }
        })

        await context.app.service('jobs/resume/documents').remove(null, {
            query: {
                jobsResumeId: context.id
            }
        })

        await context.app.service('jobs/resume/interview').remove(null, {
            query: {
                jobsResumeId: context.id
            }
        })

        await context.app.service('jobs/resume/notifications').remove(null, {
            query: {
                jobsResumeId: context.id
            }
        })

        await context.app.service('jobs/resume/remarks').remove(null, {
            query: {
                jobsResumeId: context.id
            }
        })

        await context.app.service('jobs/resume/visitor').remove(null, {
            query: {
                jobsResumeId: context.id
            }
        })

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const remarkJobsResumeVisitor = (options = {}) => {
    return async context => {
        if (context.data.isSeen) {
            const query = {
                portalResumeId: context.data.portalResumeId,
                consultantId: context.data.consultantId
            }

            if (context.data.jobsResumeId) query.jobsResumeId = context.data.jobsResumeId
            const visitor = await context.app.service('jobs/resume/visitor').findOne({ query })

            if (visitor) {
                context.result = visitor
                return context
            }
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const createJobsResumeVisitor = (options = {}) => {
    return async context => {
        const decodeToken = JwtDecode(context.params.authentication.accessToken)
        const rmsUser = await context.app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id']
            }
        }).catch(_e => { return null })

        if (!rmsUser) throw new Error('USER_NOT_EXISTED')

        const visitor = {
            jobsResumeId: context.id,
            consultantId: decodeToken.userId,
            isSeen: true
        }

        context.app.service('jobs/resume/visitor').findOne({ query: visitor })
            .then(async jrVisitor => {
                if (jrVisitor) {
                    context.app.service('jobs/resume/visitor').patch(jrVisitor.id, {
                        createdAt: new Date()
                    })
                    return context
                }
                else
                    context.app.service('jobs/resume/visitor').create(visitor).catch(_e => { return null })
            })
            .catch(_e => { return null })
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const remarkJobsResumeStatus = (options = {}) => {
    return async context => {
        if (context.data.remarks) {
            await context.app.service('jobs/resume/remarks').create({
                jobsResumeId: context.id,
                remark: context.data.remarks,
                interviewDateRemark: context.data.interviewDate,
                jobsResumeStatus: context.data.status
            }).catch(_e => { return null })
        }
        return context
    }
}
