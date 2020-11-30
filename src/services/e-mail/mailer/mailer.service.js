// Initializes the `mailer` service on path `/mailer`
import hooks from './mailer.hooks'
import Mailer from 'feathers-mailer'
import smtpTransport from 'nodemailer-smtp-transport'

import { BadRequest, NotAuthenticated, GeneralError } from '@feathersjs/errors'
import multer from 'multer'
import JwtDecode from 'jwt-decode'

import CONSTANT from '../../../constant'
import { s3Crms } from '../../../utils'

export default function (app) {
    app.use('/mailer', Mailer(smtpTransport({
        host: `email-smtp.${process.env.SES_REGION}.amazonaws.com`,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE == '1',
        auth: {
            user: process.env.SMTP_USER_NAME_AWS,
            pass: process.env.SMTP_PASS_AWS
        }
    })))

    function getResumeS3(company, resumePath) {
        return new Promise((resolve, reject) => {
            return s3Crms.getObject({
                Bucket: CONSTANT.CRMS_BUCKET,
                Key: `${company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}${resumePath}`
            }, (err, data) => {
                if (err) {
                    // in old system, the folder will contain in resume/pdfs/ and not in resume/
                    return s3Crms.getObject({
                        Bucket: CONSTANT.CRMS_BUCKET,
                        Key: `${company.companyUrl}/${CONSTANT.RESUME_PDF_AWS_FOLDER}${resumePath}`
                    }, async (err, data) => {
                        if (err) reject(err.message === 'The specified key does not exist.' ? 'FILE_NOT_EXISTED' : 'ERR_CONNECTION')
                        resolve(data)
                    })
                }
                resolve(data)
            })
        })
    }

    app.post('/send-email', multer({}).array('files'), async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))
        if (!req.body.toEmail || !req.body.subject || !req.body.content) return res.status(400).send(new BadRequest('MISSING_REQUIRED_FIELD'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(_err => {
            return res.status(500).send(new NotAuthenticated('USER_NOT_EXISTED'))
        })

        const rmsUserName = (rmsUser.firstName || '') + ' ' + (rmsUser.lastName || '')
        let sendToUser = JSON.parse(req.body.toEmail)
        if (Array.isArray(sendToUser) && rmsUser.user && rmsUser.user.email) {
            sendToUser = sendToUser.concat(rmsUser.user.email)
        }

        const mailFrom = `${rmsUserName} from ${rmsUser.company && rmsUser.company.name ? rmsUser.company.name : ''} <${process.env.SMTP_NOTIFICATION_EMAIL}>`
        let email = {
            from: mailFrom,
            to: sendToUser,
            subject: req.body.subject,
            bcc: req.body.bcc ? JSON.parse(req.body.bcc) : null,
            html: req.body.content,
            replyTo: rmsUser.user.email,
            attachments: []
        }

        if (req.body.nominateResume) {
            if (!req.body.resumeId)
                return res.status(400).send(new BadRequest('RESUME_ID_IS_REQUIRED'))
            if (!req.body.jobResumeId)
                return res.status(400).send(new BadRequest('RESUME_ID_IS_REQUIRED'))
            if (!rmsUser.companyId)
                return res.status(400).send(new BadRequest('ARMS_NOT_ALLOWED'))

            const { company } = rmsUser
            const resumeArray = JSON.parse(req.body.resumeId)
            const jobResumeArray = JSON.parse(req.body.jobResumeId)
            const getResumeAttachment = await resumeArray.map(async (resumeId, index) => {
                const jobResume = await app.service('jobs/resume').get(jobResumeArray[index], {
                    query: {
                        $select: ['id', 'resumePdfPath', 'resumeName']
                    }
                })

                const resumePath = jobResume.resumePdfPath

                const data = await getResumeS3(company, resumePath).catch(_err => { return null })
                if (data)
                    email.attachments.push({
                        filename: jobResume.resumeName,
                        content: data.Body
                    })

                // Gen token
                // eslint-disable-next-line no-unused-vars
                const patchToInterview = await app.service('authentication').createAccessToken({
                    jobResumeId: jobResumeArray[index],
                    status: 4, // interview
                    hiringDepartmentNominate: true
                }, CONSTANT.TOKEN_OPTIONS.PATCH_JOB_RESUME_TOKEN, CONSTANT.TOKEN_SECRET)
                    .catch(_e => { return null })

                // eslint-disable-next-line no-unused-vars
                const patchToNotShortListed = await app.service('authentication').createAccessToken({
                    jobResumeId: jobResumeArray[index],
                    status: 3, // not short listed
                    hiringDepartmentNominate: true
                }, CONSTANT.TOKEN_OPTIONS.PATCH_JOB_RESUME_TOKEN, CONSTANT.TOKEN_SECRET)
                    .catch(_e => { return null })

                // gen download url
                const urlResume = s3Crms.getSignedUrl('getObject', {
                    Bucket: CONSTANT.CRMS_BUCKET,
                    Key: `${company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}${resumePath}`,
                    Expires: CONSTANT.S3_URL_EXPIRE
                })


                email.html = await email.html
                    // .replace(`[arrangeForInterview-${resumeId}]`, `${process.env.CRMS_URL}/nominate-feedback?token=${patchToInterview}`)
                    // .replace(`[notShortlisted-${resumeId}]`, `${process.env.CRMS_URL}/nominate-feedback?token=${patchToNotShortListed}`)
                    .split(`[downloadCv-${resumeId}]`).join(urlResume) // .replace(`[downloadCv-${resumeId}]`, urlResume)
            })

            await Promise.all(getResumeAttachment)
        }

        if (req.files)
            req.files.map(file => {
                email.attachments.push({
                    filename: file.originalname,
                    content: file.buffer
                })
            })

        await app.service('mailer').create(email).catch(_err => {
            return res.status(500).send(new GeneralError('ERR_CONNECTION'))
        })

        return res.status(200).send({ state: true, msg: 'EMAIL_SENT_SUCCESSFUL' })
    })


    app.post('/email-template', multer({}).array('files'), async (req, res) => {
        if (!req.body.fromEmail) res.status(400).send(new BadRequest('FROM_EMAIL_IS_REQUIRED'))
        if (!req.body.toEmail) res.status(400).send(new BadRequest('TO_EMAIL_IS_REQUIRED'))
        if (!req.body.subject) res.status(400).send(new BadRequest('SUBJECT_EMAIL_IS_REQUIRED'))
        if (!req.body.content) res.status(400).send(new BadRequest('CONTENT_EMAIL_IS_REQUIRED'))

        const mailer = await app.service('mailer').create({
            from: req.body.fromEmail,
            to: JSON.parse(req.body.toEmail),
            subject: req.body.subject,
            bcc: req.body.bcc ? JSON.parse(req.body.bcc) : null,
            html: req.body.content
        }).catch(_e => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })

        return res.status(200).send(mailer)
    })

    const service = app.service('mailer')
    service.hooks(hooks)
}
