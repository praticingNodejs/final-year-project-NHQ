// Initializes the `jobs-resume-acknowledgements` service on path `/jobs/resume/acknowledgements`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/jobs/jobs-resume/jobs-resume-acknowledgements.model'
import hooks from './jobs-resume-acknowledgements.hooks'

import ejs from 'ejs'
import { NotAuthenticated, BadRequest, GeneralError } from '@feathersjs/errors'
import JwtDecode from 'jwt-decode'
import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'
import moment from 'moment-timezone'

import CONSTANT from '../../../../constant'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    app.get('/jobs/resume/acknowledgements/download/consent-notification/:jobsResumeAcknowledgementId', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

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
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })

        const jobsResumeAcknowledgement = await app.service('jobs/resume/acknowledgements').get(req.params.jobsResumeAcknowledgementId).catch(_e => { return req.status(400).send(new BadRequest('JOBS_RESUME_ACKNOWLEDGEMENT_NOT_EXISTED')) })
        const jobsResume = await app.service('jobs/resume').get(jobsResumeAcknowledgement.jobsResumeId).catch(_e => { return req.status(400).send(new BadRequest('JOBS_RESUME_NOT_EXISTED')) })

        const listResumeContacts = await app.service('resume/contacts').find({
            query: {
                category: 3,
                resumeId: jobsResume.resumeId
            },
            paginate: false
        }).then(result => {
            return result.map(({ value }) => value)
        }).catch(_e => { return [] })

        if (jobsResume.resume.user?.email) {
            listResumeContacts.push(jobsResume.resume.user.email)
        }

        let templateConsent = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.JR_NOTIFICATION.CONSENT_NOTIFICATION), {
            candidateFirstName: jobsResumeAcknowledgement.emailMessage,
            candidateName: (jobsResume.resume?.firstName || '') + ' ' + (jobsResume.resume?.lastName || ''),
            downloadPdf: true,
            sentOn: moment(jobsResumeAcknowledgement.sentAt).format('DD-MMM-YYYY HH:mm:ss'),
            email: listResumeContacts,
            companyImage: `${process.env.AWS_ENDPOINT}/${CONSTANT.CRMS_BUCKET}/${jobsResume.job.company.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${jobsResume.job.company.imagePath}`,
            position: jobsResumeAcknowledgement.position || '',
            projectName: jobsResumeAcknowledgement.projectName || '',
            website: jobsResumeAcknowledgement.website ? (` - ${jobsResumeAcknowledgement.website}` || '') : '',
            availability: jobsResumeAcknowledgement.availability || '',
            workCountry: jobsResumeAcknowledgement.jobLocation,
            workWeekHours: jobsResumeAcknowledgement.workWeekHours || '',
            typeOfHiring: jobsResumeAcknowledgement.typeOfHiring || '',
            contractDuration: jobsResume.job.contractDuration || '-',
            expCurrency: jobsResumeAcknowledgement.expectedSalary || '',
            remark: jobsResumeAcknowledgement.otherComment || '',
            note: jobsResumeAcknowledgement.importantNotes || '',
            policy: jobsResumeAcknowledgement.policy || '',
            portalUrl: process.env.JOB_PORTAL_URL,
            emailSignature: rmsUser.emailSign || CONSTANT.GET_USER_SIGN(rmsUser)
        }).catch(_e => { return '' })

        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-gpu',
                ]
            })
            const page = await browser.newPage()

            await page.setContent(templateConsent)

            await page.pdf({
                path: 'ConsentNotification.pdf',
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '50px',
                    bottom: '50px',
                    left: '5px',
                    right: '5px'
                }
            })
            await browser.close()
        } catch (_e) {
            return res.status(500).send(new GeneralError('DOWNLOAD_CONSENT_NOTIFICATION_ERROR'))
        }

        res.download('ConsentNotification.pdf', () => {
            fs.unlinkSync('ConsentNotification.pdf')
        })
    })

    // Initialize our service with any options it requires
    app.use('/jobs/resume/acknowledgements', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/resume/acknowledgements')

    service.hooks(hooks)
}
