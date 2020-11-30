// Initializes the `jobs/resume` service on path `/jobs/resume`
import createService from 'feathers-sequelize'
import createModel from '../../../models/jobs/jobs-resume/jobs-resume.model'
import hooks from './jobs-resume.hooks'

import { NotAuthenticated, GeneralError, BadRequest } from '@feathersjs/errors'
import JwtDecode from 'jwt-decode'
import fs from 'fs'
import multer from 'multer'
import md5 from 'md5'
import _ from 'lodash'
import ejs from 'ejs'
import path from 'path'
import moment from 'moment-timezone'

import { s3Crms as s3 } from '../../../utils'
import CONSTANT from '../../../constant'
import { body, validationResult } from 'express-validator'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['patch', 'remove']
    }

    app.post('/jobs/resume/upload-costing/:jobResumeId', multer({}).single('file'), async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const jobResume = await app.service('jobs/resume').get(req.params.jobResumeId).catch(_e => { return res.status(400).send(new BadRequest('JOB_RESUME_NOT_EXISTED')) })

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })

        let { company } = rmsUser
        if (!company)
            return res.status(500).send(new GeneralError('USER_NOT_ALLOWED'))

        if (jobResume.costing !== null)
            s3.deleteObject({
                Bucket: CONSTANT.CRMS_BUCKET,
                Key: `${company.companyUrl}/jobresumerelation/${jobResume.costing}`
            }, (err, _data) => {
                if (err)
                    return res.status(500).send(new GeneralError('USER_NOT_ALLOWED'))
            })

        s3.createBucket(() => {
            const wsPath = `${req.file.originalname.split('.')[0]}_${md5(Date.now())}.${req.file.originalname.split('.').pop()}`
            s3.upload({
                client: s3,
                Bucket: CONSTANT.CRMS_BUCKET,
                Key: `${company.companyUrl}/jobresumerelation/${wsPath}`,
                Body: req.file.buffer
            }, async (err, _data) => {
                if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))

                await app.service('jobs/resume').patch(jobResume.id, {
                    costing: wsPath,
                    costingOriginalName: req.file.originalname
                }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })
                res.status(200).send(JSON.stringify({ state: true, wsPath }))
            })
        })
    })

    app.get('/jobs/resume/download-costing/:jobResumeId', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const jobResume = await app.service('jobs/resume').get(req.params.jobResumeId).catch(_err => { return res.status(500).send(new GeneralError('JOB_RESUME_NOT_EXISTED')) })

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(_err => { return res.status(500).send(new GeneralError('USER_NOT_EXISTED')) })

        let { company } = rmsUser
        if (!company)
            return res.status(500).send(new GeneralError('USER_NOT_ALLOWED'))

        s3.getObject({
            Bucket: CONSTANT.CRMS_BUCKET,
            Key: `${company.companyUrl}/jobresumerelation/${jobResume.costing}`
        }, async (err, data) => {
            if (err) return res.status(500).send(new GeneralError('FILE_NOT_EXISTED'))
            try {
                fs.writeFileSync(jobResume.costingOriginalName, data.Body)
                res.download(jobResume.costingOriginalName, () => {
                    fs.unlinkSync(jobResume.costingOriginalName)
                })
            } catch (_e) {
                return true
            }
        })
    })

    app.get('/jobs/resume/same-position/:jobId', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'companyId']
            }
        }).catch(_err => { return res.status(500).send(new GeneralError('USER_NOT_EXISTED')) })

        const sequelize = await app.get('sequelizeClient')
        const queryResumeId = await sequelize.query(`
            SELECT DISTINCT ON (resume_id) resume_id, job_id, jr.id FROM jobs_resume AS jr
            INNER JOIN resume ON resume.id = jr.resume_id
            INNER JOIN jobs job ON job.id = jr.job_id
            WHERE
            (
                (
                    job."rankId" = (SELECT "rankId" FROM jobs WHERE id = ${req.params.jobId})
                    AND job."designationId" = (SELECT "designationId" FROM jobs WHERE id = ${req.params.jobId})
                    AND job."disciplineId" = (SELECT "disciplineId" FROM jobs WHERE id = ${req.params.jobId})
                ) OR (
                    job.position iLike (SELECT position FROM jobs WHERE id = ${req.params.jobId})
                )
            ) AND job.id != ${req.params.jobId}
            AND job."companyId" = ${rmsUser.companyId}
            AND (
                    (resume.root_resume_id is null AND resume.user_id is null AND resume.company_id = ${rmsUser.companyId}) -- crms
                OR
                    (resume.root_resume_id is null AND resume.user_id is not null AND resume.company_id is null) -- js original
                OR
                    (resume.root_resume_id is not null AND resume.user_id is not null AND resume.company_id = ${rmsUser.companyId} AND jr.is_approved = 1 AND consultant_id IS NOT NULL) -- cloned that is approved
            );
        `).catch(_e => { return [] })

        const listJobResumeId = (queryResumeId[0]).map(({ id }) => id)

        const jobsResume = await app.service('jobs/resume').find({
            query: {
                id: {
                    $in: listJobResumeId
                }
            },
            paginate: false
        }).catch(_e => { return [] })

        return res.status(200).send({ total: jobsResume.length, data: jobsResume })
    })

    app.get('/jobs/resume/download-resume/:jobResumeId', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const jobResume = await app.service('jobs/resume').get(req.params.jobResumeId).catch(_e => { return res.status(400).send(new BadRequest('JOB_RESUME_NOT_EXISTED')) })

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'companyId']
            }
        }).catch(_err => { return res.status(500).send(new GeneralError('USER_NOT_EXISTED')) })

        const { company } = rmsUser

        if (!company)
            res.status(500).send(new BadRequest('USER_NOT_ALLOWED'))

        if (_.intersection(rmsUser.user.role, CONSTANT.VALIDATE_ROLE_CRMS).length > 0 || jobResume.job?.companyId === company.id) {
            return s3.getObject({
                Bucket: CONSTANT.CRMS_BUCKET,
                Key: `${company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}${jobResume.resumePdfPath}`
            }, async (err, data) => {
                if (err) {
                    return s3.getObject({
                        Bucket: CONSTANT.CRMS_BUCKET,
                        Key: `${company.companyUrl}/${CONSTANT.RESUME_PDF_AWS_FOLDER}${jobResume.resumePdfPath}`
                    }, async (err, data) => {
                        if (err) return res.status(500).send(new BadRequest(err.message === 'The specified key does not exist.' ? 'FILE_NOT_EXISTED' : 'ERR_CONNECTION'))
                        try {
                            fs.writeFileSync(jobResume.resume.originalResumeName, data.Body)
                            return res.download(jobResume.resume.originalResumeName, () => {
                                fs.unlinkSync(jobResume.resume.originalResumeName)
                            })
                        } catch (_e) {
                            return true
                        }
                    })
                }

                try {
                    fs.writeFileSync(jobResume.resume.originalResumeName, data.Body)
                    return res.download(jobResume.resume.originalResumeName, () => {
                        fs.unlinkSync(jobResume.resume.originalResumeName)
                    })
                } catch (_e) {
                    return true
                }
            })
        } else {
            return res.status(500).send(new BadRequest('USER_NOT_ALLOWED'))
        }
    })

    app.post('/jobs/resume/button-nominate-email', async (req, res) => {
        if (!req.body.token) return res.status(400).send(new BadRequest('MISSING_FIELD_REQUIRED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.body.token)
        } catch (_e) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        if (decodeToken.hiringDepartmentNominate) {
            const jobsResume = await app.service('jobs/resume').patch(decodeToken.jobsResumeId, {
                status: decodeToken.status
            }).catch(_e => { return null })

            return res.status(200).send(jobsResume)
        } else {
            return res.status(400).send(new BadRequest('USER_NOT_ALLOWED'))
        }

    })

    app.post('/jobs/resume/not-shortlisted/:jobResumeId', [
        body('notification').notEmpty().withMessage('MISSING_FIELD_REQUIRED')
    ], async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        const errors = await validationResult(req).errors
        if (errors.length > 0)
            return res.status(400).send(new BadRequest(errors[0].msg))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const jobResume = await app.service('jobs/resume').get(req.params.jobResumeId).catch(_e => { return res.status(400).send(new BadRequest('JOB_RESUME_NOT_EXISTED')) })

        try {
            let listRmsUser = []

            const rmsUser = await app.service('rms-users-info').findOne({
                query: {
                    userId: decodeToken.userId,
                    $select: ['id', 'userId', 'companyId', 'firstName', 'lastName', 'emailSign', 'signEmail']
                }
            }).catch(_err => { return res.status(500).send(new GeneralError('USER_NOT_EXISTED')) })
            listRmsUser = listRmsUser.concat(rmsUser.user.email)

            const rmsContacts = await app.service('resume/contacts').find({
                query: {
                    resumeId: jobResume.resumeId
                },
                paginate: false
            }).then(result => {
                return result.length > 0 ? result.map(({ value }) => value) : []
            }).catch(_e => { return [] })
            listRmsUser = listRmsUser.concat(rmsContacts)

            const userEmail = await app.service('users').get(jobResume.resume.userId, {
                query: {
                    $select: ['email']
                }
            }).catch(_e => { return { email: null } })
            if (userEmail.email)
                listRmsUser = listRmsUser.concat(userEmail.email)


            ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.JR_NOTIFICATION.NOT_SHORTLISTED_NOTIFICATION), {
                // companyImage: `${process.env.AWS_ENDPOINT}/${CONSTANT.CRMS_BUCKET}/${rmsUser.company.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${rmsUser.company.imagePath}`,
                submittedOn: moment(jobResume.submittedOn).format('DD-MMM-YYYY'),
                position: jobResume.job.position,
                projectName: req.body.showProjectInfo ? (jobResume.job.project.name || '-') : '-',
                notification: req.body.notification || '-',
                portalUrl: process.env.JOB_PORTAL_URL,
                emailSignature: rmsUser.emailSign || CONSTANT.GET_USER_SIGN(rmsUser)
            }).then(async result => {
                const email = {
                    // from: `${CONSTANT.FROM_EMAIL.DEFAULT} ${rmsUser.firstName || ''} ${rmsUser.lastName || ''} <${process.env.SMTP_USER}>`,
                    from: `${rmsUser.firstName || ''} ${rmsUser.lastName || ''} from ${rmsUser.company.name} <${process.env.SMTP_NOTIFICATION_EMAIL}>`,
                    to: listRmsUser,
                    subject: 'Bluebox - APPLICATION STATUS',
                    html: result,
                    replyTo: rmsUser.user.email
                }
                app.service('mailer').create(email)
                app.service('jobs/resume').patch(jobResume.id, {
                    notification: req.body.notification
                })
                res.status(200).send('SEND_NOTIFICATION_SUCCESSFUL')
            }).catch(_e => {
                return res.status(500).send(new GeneralError('ERR_CONNECTION'))
            })
        } catch (_e) {
            return res.status(500).send(new GeneralError('ERR_CONNECTION'))
        }
    })

    app.post('/jobs/resume/interview-and-failed/:jobResumeId', [
        body('notification').notEmpty().withMessage('MISSING_FIELD_REQUIRED')
    ], async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        const errors = await validationResult(req).errors
        if (errors.length > 0)
            return res.status(400).send(new BadRequest(errors[0].msg))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const jobResume = await app.service('jobs/resume').get(req.params.jobResumeId).catch(_e => { return res.status(400).send(new BadRequest('JOB_RESUME_NOT_EXISTED')) })

        try {
            let listRmsUser = []

            const rmsUser = await app.service('rms-users-info').findOne({
                query: {
                    userId: decodeToken.userId,
                    $select: ['id', 'userId', 'companyId', 'firstName', 'lastName', 'emailSign', 'signEmail']
                }
            }).catch(_err => { return res.status(500).send(new GeneralError('USER_NOT_EXISTED')) })
            listRmsUser = listRmsUser.concat(rmsUser.user.email)

            const rmsContacts = await app.service('resume/contacts').find({
                query: {
                    resumeId: jobResume.resumeId
                },
                paginate: false
            }).then(result => {
                return result.length > 0 ? result.map(({ value }) => value) : []
            }).catch(_e => { return [] })
            listRmsUser = listRmsUser.concat(rmsContacts)

            const userEmail = await app.service('users').get(jobResume.resume.userId, {
                query: {
                    $select: ['email']
                }
            }).catch(_e => { return { email: null } })
            if (userEmail.email)
                listRmsUser = listRmsUser.concat(userEmail.email)


            ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.JR_NOTIFICATION.INTERVIEW_AND_FAILED), {
                // companyImage: `${process.env.AWS_ENDPOINT}/${CONSTANT.CRMS_BUCKET}/${rmsUser.company.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${rmsUser.company.imagePath}`,
                submittedOn: moment(jobResume.submittedOn).format('DD-MMM-YYYY'),
                position: jobResume.job.position || '-',
                projectName: req.body.showProjectInfo ? (jobResume.job.project.name || '-') : '-',
                notification: req.body.notification || '-',
                portalUrl: process.env.JOB_PORTAL_URL,
                emailSignature: rmsUser.emailSign || CONSTANT.GET_USER_SIGN(rmsUser)
            }).then(async result => {
                const email = {
                    // from: `${CONSTANT.FROM_EMAIL.DEFAULT} ${rmsUser.firstName || ''} ${rmsUser.lastName || ''} <${process.env.SMTP_USER}>`,
                    from: `${rmsUser.firstName || ''} ${rmsUser.lastName || ''} from ${rmsUser.company.name} <${process.env.SMTP_NOTIFICATION_EMAIL}>`,
                    to: listRmsUser,
                    subject: `Ref No: ${jobResume.resumeId}, Job No: ${jobResume.jobId}`,
                    html: result,
                    replyTo: rmsUser.user.email
                }
                app.service('mailer').create(email)
                app.service('jobs/resume').patch(jobResume.id, {
                    notification: req.body.notification
                })
                res.status(200).send('SEND_NOTIFICATION_SUCCESSFUL')
            }).catch(_e => {
                return res.status(500).send(new GeneralError('ERR_CONNECTION'))
            })
        } catch (_e) {
            return res.status(500).send(new GeneralError('ERR_CONNECTION'))
        }
    })

    // Initialize our service with any options it requires
    app.use('/jobs/resume', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/resume')

    service.hooks(hooks)
}
