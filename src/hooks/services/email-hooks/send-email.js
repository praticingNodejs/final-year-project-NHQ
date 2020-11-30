// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import ejs from 'ejs'
import path from 'path'
import moment from 'moment-timezone'
import JwtDecode from 'jwt-decode'
import {
    BadRequest
} from '@feathersjs/errors'

import CONSTANT from '../../../constant'

import { s3Crms } from '../../../utils'

async function getConsultant(context, jobs) {
    const assignedToConsultant = await context.app.service('jobs/coowners').find({
        query: {
            jobId: jobs.id,
            $select: ['consultantId']
        },
        paginate: false
    }).then(async result => {
        return result.map(({
            consultantId
        }) => consultantId)
    }).catch(_e => {
        return []
    })

    const consultantEmail = await context.app.service('users').find({
        query: {
            id: {
                $in: assignedToConsultant
            }
        },
        paginate: false
    }).then(users => {
        return users.map(({
            email
        }) => email)
    }).catch(_e => {
        return []
    })

    return consultantEmail
}

// eslint-disable-next-line no-unused-vars
export const sendEmailRules = (options = {}) => {
    return async context => {
        const decodeToken = JwtDecode(context.params.authentication.accessToken)
        const currentUser = await context.app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'firstName', 'lastName', 'emailSign', 'signEmail', 'companyId']
            }
        })

        if (context.path === 'jobs') {
            if (context.method === 'patch') {
                const { jobs } = context.params
                let listRmsUser = await context.app.service('email/rms-users').find({
                    query: {
                        companyId: jobs.companyId,
                        emailRuleId: jobs.statusId !== context.data.statusId && context.data.statusId ? 1 : 6, // change jobs status || update jobs
                        $select: ['userId']
                    },
                    paginate: false
                }).then(result => {
                    return result.map(({ userEmail }) => userEmail)
                }).catch(_e => {
                    return []
                })

                let assignedTo = context.data.assignedTos && Array.isArray(context.data.assignedTos) && context.data.assignedTos.length > 0 ?
                    await context.app.service('rms-users-info').find({
                        query: {
                            userId: {
                                $in: context.data.assignedTos
                            },
                            $select: ['firstName', 'lastName']
                        },
                        paginate: false
                    }).then(result => {
                        return result.map(rmsUser => {
                            return `${rmsUser.firstName || ''} ${rmsUser.lastName || ''}`
                        })
                    }).catch(_e => {
                        return []
                    }) : []
                listRmsUser = listRmsUser.concat(assignedTo)

                const currentCoOwner = await context.app.service('jobs/coowners').find({
                    query: {
                        jobId: jobs.id
                    },
                    paginate: false
                }).then(result => {
                    return result.map(rmsUser => {
                        return (rmsUser.consultant?.firstName || '') + ' ' + (rmsUser.consultant?.lastName || '')
                    })
                }).catch(_e => {
                    return []
                })
                listRmsUser = listRmsUser.concat(currentCoOwner)

                // if there is no assignedTos, means client only change job status, get the current assignTo job
                if(!context.data.assignedTos) {
                    assignedTo = currentCoOwner
                }

                const consultantEmail = await getConsultant(context, jobs)
                listRmsUser = listRmsUser.concat(consultantEmail)

                const rmsUpdated = await context.app.service('rms-users-info').findOne({
                    query: {
                        userId: context.data.updatedBy,
                        $select: ['firstName', 'lastName', 'userId']
                    }
                })
                rmsUpdated.fullName = `${rmsUpdated.firstName || ''} ${rmsUpdated.lastName || ''}`

                if (rmsUpdated?.user?.email) {
                    listRmsUser = listRmsUser.concat(rmsUpdated.user.email)
                }

                if (context.data.statusId && context.data.statusId !== jobs.statusId) {
                    ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.RMS_RULES.UPDATE_JOB_STATUS), {
                        position: jobs.position,
                        jobRef: jobs.id,
                        jobRefLink: `${process.env.CRMS_URL}/jobs/${jobs.id}/detail?view=info`,
                        projectName: jobs.project.name || '-',
                        updatedAt: moment().format('DD-MMM-YYYY'),
                        assignedTo: assignedTo?.length > 0 ? assignedTo.join(', ') : 'Unassigned',
                        typeOfHiring: !jobs.isPlacement? CONSTANT.JOBS_HIRING_TYPE(jobs.hiringType) + ' / ' + `Contract - ${jobs.contractDuration}` : CONSTANT.JOBS_HIRING_TYPE(jobs.hiringType) + ' / ' + 'Permanent',
                        remarks: context.data.remark || '-',
                        jobStatus: context.result.status?.name || '-',
                        updatedBy: rmsUpdated.fullName || '-',
                        portalUrl: process.env.JOB_PORTAL_URL,
                        emailSignature: currentUser.emailSign || CONSTANT.GET_USER_SIGN(currentUser)
                    }).then(async result => {
                        const email = {
                            // from: `${CONSTANT.FROM_EMAIL.DEFAULT} ${currentUser.firstName || ''} ${currentUser.lastName || ''} <${process.env.SMTP_USER}>`,
                            from: `${currentUser.firstName || ''} ${currentUser.lastName || ''} from ${jobs.company.name} <${process.env.SMTP_NOTIFICATION_EMAIL}>`,
                            to: listRmsUser,
                            subject: jobs.statusId !== context.data.statusId && context.data.statusId ? `${rmsUpdated.fullName} changed the Job(${jobs.id}) Status` : `${rmsUpdated.fullName} updated the Job(${jobs.id})`,
                            html: result,
                            replyTo: currentUser.user.email
                        }
                        context.app.service('mailer').create(email)
                    })
                } else {
                    ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.RMS_RULES.UPDATE_JOB), {
                        // companyImage: `${process.env.AWS_ENDPOINT}/${CONSTANT.CRMS_BUCKET}/${jobs.company.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${jobs.company.imagePath}`,
                        position: jobs.position,
                        jobRef: jobs.id,
                        jobRefLink: `${process.env.CRMS_URL}/jobs/${jobs.id}/detail?view=info`,
                        projectName: jobs.project.name || '-',
                        updatedAt: moment().format('DD-MMM-YYYY'),
                        assignedTo: assignedTo?.length > 0 ? assignedTo.join(', ') : 'Unassigned',
                        jobStatus: jobs.status?.name || '-',
                        typeOfHiring: !jobs.isPlacement? CONSTANT.JOBS_HIRING_TYPE(jobs.hiringType) + ' / ' + `Contract - ${jobs.contractDuration}` : CONSTANT.JOBS_HIRING_TYPE(jobs.hiringType) + ' / ' + 'Permanent',
                        workCountry: jobs.workCountryLocation?.name || '-',
                        remarks: context.data.remark || '-',
                        updatedBy: rmsUpdated.fullName || '-',
                        portalUrl: process.env.JOB_PORTAL_URL,
                        emailSignature: currentUser.emailSign || CONSTANT.GET_USER_SIGN(currentUser)
                    }).then(async result => {
                        const email = {
                            // from: `${CONSTANT.FROM_EMAIL.DEFAULT} ${currentUser.firstName || ''} ${currentUser.lastName || ''} <${process.env.SMTP_USER}>`,
                            from: `${currentUser.firstName || ''} ${currentUser.lastName || ''} from ${jobs.company.name} <${process.env.SMTP_NOTIFICATION_EMAIL}>`,
                            to: listRmsUser,
                            subject: jobs.statusId !== context.data.statusId && context.data.statusId ? `${rmsUpdated.fullName} changed the Job(${jobs.id}) Status` : `${rmsUpdated.fullName} updated the Job(${jobs.id})`,
                            html: result,
                            replyTo: currentUser.user.email
                        }
                        context.app.service('mailer').create(email)
                    })
                }
                return context
            }

            if (context.method === 'create') {
                const jobs = context.result

                let listRmsUser = await context.app.service('email/rms-users').find({
                    query: {
                        companyId: jobs.companyId,
                        emailRuleId: 5, // add,
                        $select: ['userId']
                    },
                    paginate: false
                }).then(result => {
                    return result.map(({
                        userEmail
                    }) => userEmail)
                }).catch(_e => {
                    return []
                })

                const rmsCreated = await context.app.service('rms-users-info').findOne({
                    query: {
                        userId: context.data.createdBy,
                        $select: ['firstName', 'lastName', 'userId']
                    }
                })

                const assignedTo = await context.app.service('rms-users-info').find({
                    query: {
                        userId: {
                            $in: context.data.assignedTos
                        },
                        $select: ['firstName', 'lastName']
                    },
                    paginate: false
                }).then(result => {
                    return result.map(rmsUser => {
                        return `${rmsUser.firstName || ''} ${rmsUser.lastName || ''}`
                    })
                }).catch(_e => {
                    return []
                })

                const consultantEmail = await getConsultant(context, jobs)
                listRmsUser = listRmsUser.concat(consultantEmail)

                if (rmsCreated.user?.email) {
                    listRmsUser = listRmsUser.concat(rmsCreated.user.email)
                }

                ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.RMS_RULES.ADD_JOB), {
                    // companyImage: `${process.env.AWS_ENDPOINT}/${CONSTANT.CRMS_BUCKET}/${jobs.company.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${jobs.company.imagePath}`,
                    position: jobs.position,
                    jobRef: jobs.id,
                    jobRefLink: `${process.env.CRMS_URL}/jobs/${jobs.id}/detail?view=info`,
                    projectName: jobs.project.name || '-',
                    updatedAt: moment().format('DD-MMM-YYYY'),
                    assignedTo: assignedTo?.length > 0 ? assignedTo.join(', ') : 'Unassigned',
                    jobStatus: jobs.status?.name || '-',
                    typeOfHiring: !jobs.isPlacement? CONSTANT.JOBS_HIRING_TYPE(jobs.hiringType) + ' / ' + `Contract - ${jobs.contractDuration}` : CONSTANT.JOBS_HIRING_TYPE(jobs.hiringType) + ' / ' + 'Permanent',
                    location: jobs.workCountryLocation?.name || '-',
                    //salary: jobs.otherRates === 1 ? `Min: ${jobs.minSalary || 'Undefined'} - Max: ${jobs.maxSalary || 'Undefined'}` + ', ' + jobs.salaryCurrencyObj?.name + ' ' + CONSTANT.SALARY_PERIOD(jobs.salaryFreq) : 'Negotiate',
                    salary: `Min: ${jobs.minSalary || 'Undefined'} - Max: ${jobs.maxSalary || 'Undefined'}` + ', ' + jobs.salaryCurrencyObj?.name + ' ' + CONSTANT.SALARY_PERIOD(jobs.salaryFreq),
                    workCountry: jobs.workCountryLocation?.name || '-',
                    remarks: jobs.interviewerProfile || '-',
                    updatedBy: `${rmsCreated.firstName || ''} ${rmsCreated.lastName || ''}` || '-',
                    portalUrl: process.env.JOB_PORTAL_URL,
                    emailSignature: currentUser.emailSign || CONSTANT.GET_USER_SIGN(currentUser)
                }).then(async result => {
                    const email = {
                        // from: `${CONSTANT.FROM_EMAIL.DEFAULT} ${currentUser.firstName || ''} ${currentUser.lastName || ''} <${process.env.SMTP_USER}>`,
                        from: `${currentUser.firstName || ''} ${currentUser.lastName || ''} from ${jobs.company.name} <${process.env.SMTP_NOTIFICATION_EMAIL}>`,
                        to: listRmsUser,
                        subject: `New Job(${jobs.id})`,
                        html: result,
                        replyTo: currentUser.user.email
                    }
                    context.app.service('mailer').create(email)
                })

                return context
            }
        }

        if (context.path === 'jobs/resume') {
            if ('status' in context.data && context.params.service.status !== context.data.status) {
                const jobResume = context.result
                if (jobResume.resume && jobResume.job) {
                    const typeUser = CONSTANT.RMS_USER_EMAIL_RULE(context.data.status)
                    if (typeUser) {
                        let listRmsUser = (await context.app.service('email/rms-users').find({
                            query: {
                                companyId: jobResume.job.companyId,
                                emailRuleId: typeUser,
                                $select: ['userId']
                            },
                            paginate: false
                        }).catch(_e => {
                            return []
                        })).map(({
                            userEmail
                        }) => userEmail)

                        const rmsUpdated = await context.app.service('rms-users-info').findOne({
                            query: {
                                userId: context.data.updatedBy,
                                $select: ['firstName', 'lastName', 'userId']
                            }
                        })
                        const rmsUpdatedName = `${rmsUpdated.firstName || ''} ${rmsUpdated.lastName || ''}`
                        const consultantEmail = await getConsultant(context, jobResume.job)
                        listRmsUser = listRmsUser.concat(consultantEmail)

                        if (rmsUpdated.user?.email) {
                            listRmsUser = listRmsUser.concat(rmsUpdated.user.email)
                        }

                        let remark = `<div>${context.data.remarks}` || '-'
                        if (context.data.interviewDate) {
                            remark += ` <b>(${new Date(context.data.interviewDate)})</b>`
                        }
                        if (remark !== '-') {
                            remark += '</div>'
                        }

                        ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.RMS_RULES.UPDATE_JOB_RESUME), {
                            // companyImage: `${process.env.AWS_ENDPOINT}/${CONSTANT.CRMS_BUCKET}/${jobResume.job.company.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${jobResume.job.company.imagePath}`,
                            jobResumeStatus: CONSTANT.JOBS_RESUME_STATUS(jobResume.status),
                            position: jobResume.job.position,
                            jobRef: jobResume.job.id,
                            jobRefLink: `${process.env.CRMS_URL}/jobs/${jobResume.job.id}/detail?view=info`,
                            projectName: jobResume.job.project.name || '-',
                            updatedAt: moment().format('DD-MMM-YYYY'),
                            candidateName: (jobResume.resume?.firstName || '') + ' ' + (jobResume.resume?.lastName || ''),
                            candidateRef: jobResume.resume.id,
                            consultant: (jobResume?.consultant?.firstName || '') + ' ' + (jobResume?.consultant?.lastName || '') || 'Undefined',
                            workCountry: jobResume.job?.workCountryLocation?.name || '-',
                            updatedBy: rmsUpdatedName || '-',
                            remarks: remark,
                            portalUrl: process.env.JOB_PORTAL_URL,
                            emailSignature: currentUser.emailSign || CONSTANT.GET_USER_SIGN(currentUser)
                        }).then(async result => {
                            const email = {
                                // from: `${CONSTANT.FROM_EMAIL.DEFAULT} ${currentUser.firstName || ''} ${currentUser.lastName || ''} <${process.env.SMTP_USER}>`,
                                from: `${currentUser.firstName || ''} ${currentUser.lastName || ''} from ${jobResume.job.company.name} <${process.env.SMTP_NOTIFICATION_EMAIL}>`,
                                to: listRmsUser,
                                subject: `${rmsUpdatedName} changed the Resume(${jobResume.resume.id}) Status`,
                                html: result,
                                replyTo: currentUser.user.email
                            }
                            context.app.service('mailer').create(email)
                        })
                    }
                    return context
                }
            }
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const sendEmailConsentNotification = (options = {}) => {
    return async context => {
        const { jobsResume } = context.params
        const currentUser = context.params.rmsUser

        let listEmailSend = []
        let listResumeContacts = await context.app.service('resume/contacts').find({
            query: {
                category: 3,
                resumeId: jobsResume.resumeId
            },
            paginate: false
        }).then(result => {
            return result.map(({ value }) => value)
        }).catch(_e => { return [] })

        const resume = await context.app.service('resume').get(jobsResume.resumeId, {
            query: {
                $select: ['id', 'userId', 'companyId', 'originalResumeName', 'resumePath', 'firstName', 'lastName']
            }
        })

        const jobs = await context.app.service('jobs').get(jobsResume.jobId)

        listEmailSend = listEmailSend.concat(listResumeContacts)
        if (currentUser && currentUser.user && currentUser.user.email) {
            listEmailSend = listEmailSend.concat(currentUser.user.email)
        }

        if (resume.user && resume.user.email) {
            listEmailSend = listEmailSend.concat(resume.user.email)
        }

        function getResumeS3(resume) {
            return new Promise((resolve, reject) => {
                return s3Crms.getObject({
                    Bucket: CONSTANT.CRMS_BUCKET,
                    Key: `${resume.company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}${jobsResume.resumePdfPath}`
                }, (err, data) => {
                    if (err) reject(err.message === 'The specified key does not exist.' ? 'FILE_NOT_EXISTED' : 'ERR_CONNECTION')
                    resolve(data)
                })
            })
        }

        const data = await getResumeS3(resume).catch(_err => { return true })
        const consentHtml = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.JR_NOTIFICATION.CONSENT_NOTIFICATION), {
            companyImage: `${process.env.AWS_ENDPOINT}/${CONSTANT.CRMS_BUCKET}/${jobs.company.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${jobs.company.imagePath}`,
            candidateFirstName: context.result.emailMessage,
            candidateName: (resume.firstName || '') + ' ' + (resume.lastName || ''),
            position: context.result.position || '',
            projectName: context.result.projectName || '',
            website: context.result.website ? (` - ${context.result.website}` || '') : '',
            availability: context.result.availability || '',
            workCountry: context.result.jobLocation,
            workWeekHours: context.result.workWeekHours || '',
            typeOfHiring: context.result.typeOfHiring || '',
            contractDuration: jobs.contractDuration || '-',
            expCurrency: context.result.expectedSalary || '',
            remark: context.result.otherComment || '',
            note: context.result.importantNotes || '',
            policy: context.data.policy || '',
            portalUrl: process.env.JOB_PORTAL_URL,
            emailSignature: currentUser.emailSign || CONSTANT.GET_USER_SIGN(currentUser)
        })

        const email = {
            // from: `${CONSTANT.FROM_EMAIL.DEFAULT} ${currentUser.firstName || ''} ${currentUser.lastName || ''} <${process.env.SMTP_USER}>`,
            from: `${currentUser.firstName || ''} ${currentUser.lastName || ''} from ${jobs.company.name} <${process.env.SMTP_NOTIFICATION_EMAIL}>`,
            to: listEmailSend,
            subject: `Ref No:-${jobsResume.resumeId}, Job No:-${jobsResume.jobId}`,
            html: consentHtml,
            replyTo: currentUser.user.email,
            attachments: [{
                filename: jobsResume.resumeName,
                content: data.Body
            }]
        }
        context.app.service('mailer').create(email)

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const createMailNotification = (options = {}) => {
    return async context => {
        if (context.type === 'before') {
            let jobResume = await context.app.service('jobs/resume').get(context.data.jobsResumeId, {
                query: {
                    $select: ['jobId', 'resumeId', 'consultant', 'submittedOn']
                }
            }).catch(_e => { return null })

            if (!jobResume)
                throw new BadRequest('JOB_RESUME_NOT_EXISTED')

            context.params.jobResume = jobResume
        }

        if (context.type === 'after') {
            const currentUser = context.params.rmsUser

            const {
                jobResume
            } = await context.params

            const resume = await context.app.service('resume').get(jobResume.resumeId, {
                query: {
                    $select: ['id', 'userId', 'firstName', 'lastName']
                }
            })

            const user = await context.app.service('users').get(resume.userId, {
                query: {
                    $select: ['id', 'email']
                }
            }).catch(_e => {
                return null
            })

            let userEmailContact = await context.app.service('resume/contacts').find({
                query: {
                    resumeId: jobResume.resumeId,
                    category: 3,
                    $select: ['value']
                },
                paginate: false
            }).then(result => {
                return result.map(({
                    value
                }) => value)
            })

            if (currentUser.user?.email) {
                userEmailContact = userEmailContact.concat(currentUser.user.email)
            }

            if (user) {
                userEmailContact = userEmailContact.concat(user.email)
            }

            const companies = await context.app.service('companies').get(jobResume?.job?.companyId, {
                query: {
                    $select: ['id', 'companyUrl', 'imagePath', 'name', 'website']
                }
            }).catch(_e => {
                return null
            })

            ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.JR_NOTIFICATION.JOB_RESUME_NOTIFICATION), {
                submittedOn: moment(jobResume.submittedOn).format('DD-MMM-YYYY'),
                position: jobResume?.job.position,
                message: context.data.notification,
                projectName: jobResume.job?.project?.name,
                companyImage: `${CONSTANT.ROOT_AWS_PATH}${CONSTANT.CRMS_BUCKET}/${companies.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${companies.imagePath}`,
                candidateFirstName: resume.firstName,
                portalUrl: process.env.JOB_PORTAL_URL,
                emailSignature: currentUser.emailSign || CONSTANT.GET_USER_SIGN(currentUser)
            }).then(result => {
                const email = {
                    // from: `${CONSTANT.FROM_EMAIL.DEFAULT} ${currentUser.firstName || ''} ${currentUser.lastName || ''} <${process.env.SMTP_USER}>`,
                    from: `${currentUser.firstName || ''} ${currentUser.lastName || ''} from ${companies.name} <${process.env.SMTP_NOTIFICATION_EMAIL}>`,
                    to: userEmailContact,
                    subject: `Ref No:-${jobResume.resumeId}, Job No:-${jobResume.jobId}`,
                    html: result,
                    replyTo: currentUser.user.email
                }

                context.app.service('mailer').create(email)
            })
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const sendNewsEventsEmail = (options = {}) => {

}
