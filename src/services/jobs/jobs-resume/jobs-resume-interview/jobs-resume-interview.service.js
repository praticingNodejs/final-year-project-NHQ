// Initializes the `jobs-resume-interview` service on path `/jobs-resume-interview`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/jobs/jobs-resume/jobs-resume-interview.model'
import hooks from './jobs-resume-interview.hooks'

import JwtDecode from 'jwt-decode'
import multer from 'multer'
import path from 'path'
import ejs from 'ejs'
import ical from 'ical-generator'
import moment from 'moment-timezone'
import { NotAuthenticated, NotAcceptable, BadRequest, GeneralError } from '@feathersjs/errors'

import CONSTANT from '../../../../constant'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    app.use('/jobs/resume/send-interview', multer({}).array('files'), async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const currentUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })

        const requiredField = [
            'jobsResumeId', 'interviewMode', 'interviewDate', 'address',
            'personName', 'personDesignation', 'personTel',
            'docsNeeded'
        ]

        requiredField.map(field => {
            // eslint-disable-next-line no-prototype-builtins
            if (!(field in req.body)) return res.status(406).send(new NotAcceptable('MISSING_REQUIRED_FIELD'))
        })

        const jobsResume = await app.service('jobs/resume').get(req.body.jobsResumeId).catch(_e => {
            return res.status(400).send(new BadRequest('JOB_RESUME_NOT_EXISTED'))
        })

        const job = await app.service('jobs').get(jobsResume.jobId).catch(_e => {
            return res.status(400).send(new BadRequest('JOB_NOT_EXISTED'))
        })

        const resume = await app.service('resume').get(jobsResume.resumeId).catch(_e => {
            return res.status(400).send(new BadRequest('RESUME_NOT_EXISTED'))
        })

        let resumeEmail = []
        let listResumeContact = await app.service('resume/contacts').find({
            query: {
                resumeId: resume.id,
                category: 3
            },
            paginate: false
        }).then(contact => {
            return contact.map(({ value }) => value)
        }).catch(_e => { return [] })
        resumeEmail = resumeEmail.concat(listResumeContact)

        const dateTime = req.body.interviewDate

        const result = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.JR_NOTIFICATION.INTERVIEW_SCHEDULE), {
            companyImage: `${CONSTANT.ROOT_AWS_PATH}${CONSTANT.CRMS_BUCKET}/${job.company.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${job.company.imagePath}`,
            candidateFirstName: resume.firstName || '',
            name: `${resume.firstName || ''} ${resume.lastName || ''}`,
            resumeRef: resume.id,
            interviewDate: moment(dateTime).format('DD-MMM-YYYY') + ' ' + (
                moment(dateTime).format('HH:mm')
                + ' - ' +
                moment(dateTime).add(req.body.interviewDuration, 'minutes').format('HH:mm')
            ),
            jobRef: job.id,
            position: job.position,
            jobLocation: req.body.jobLocation,
            workingHour: req.body.workWeekHours,
            typeOfHire: req.body.typeOfHire || '-',
            expectedSalary: req.body.expectedSalary || '-',
            availability: req.body.availability || 'IMMEDIATE',
            interviewMode: CONSTANT.INTERVIEW_MODE(req.body.interviewMode),
            projectName: job.project.name, address: req.body.address || '-',
            personName: req.body.personName || '-', personDesignation: req.body.personDesignation || '-', personTel: req.body.personTel || '-',
            interviewerName: req.body.interviewerName || '-', interviewerDesignation: req.body.interviewerDesignation || '-', interviewerTel: req.body.interviewerTel || '-',
            jobRequirement: req.body.jobResponsibility || '-',
            document: req.body.docsNeeded || '-',
            remarks: req.body.remarks || '-',
            portalUrl: process.env.JOB_PORTAL_URL,
            emailSignature: currentUser.emailSign || CONSTANT.GET_USER_SIGN(currentUser)
        }).catch(_err => { return '' })

        const cal = ical()

        const event = cal.createEvent({
            start: moment(dateTime),
            end: req.body.interviewDuration ? moment(dateTime).add(parseInt(req.body.interviewDuration, 10), 'minutes') : moment(dateTime).add(1, 'hour'),
            timestamp: moment(dateTime),
            summary: 'Interview Schedule',
            description: req.body.remarks,
            categories: [
                { name: 'APPOINTMENT' },
                { name: 'MEETING' }
            ],
            method: 'REQUEST'
        })

        event.createAlarm({ type: 'display', trigger: 300 })
        event.createAlarm({ type: 'audio', trigger: 300 }) // 5min before event

        event.createAttendee({
            email: currentUser.user.email,
            name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`
        })

        event.organizer({
            name: `${CONSTANT.FROM_EMAIL.DEFAULT} ${currentUser.firstName || ''} ${currentUser.lastName || ''}`,
            email: process.env.SMTP_USER,
            mailto: resumeEmail
        })

        event.appleLocation({
            title: 'Interview with ',
            address: job.project.name || '-',
            radius: 40,
            geo: {
                lat: 44.4987,
                lon: -6.87667
            }
        })

        if (currentUser.user?.email)
            resumeEmail = resumeEmail.concat(currentUser.user.email)

        if (resume.user?.email)
            resumeEmail = resumeEmail.concat(resume.user.email)

        const email = {
            // from: `${CONSTANT.FROM_EMAIL.DEFAULT} ${currentUser.firstName || ''} ${currentUser.lastName || ''} <${process.env.SMTP_USER}>`,
            from: `${currentUser.firstName || ''} ${currentUser.lastName || ''} from ${job.company.name} <${process.env.SMTP_NOTIFICATION_EMAIL}>`,
            to: resumeEmail,
            subject: `${job.company.name} - Interview Invitation`,
            html: result,
            replyTo: currentUser.user.email,
            alternatives: [{
                contentType: 'text/calendar;method=REQUEST',
                content: new Buffer.from(cal.toString())
            }],
            attachments: [{
                filename: 'meeting.ics',
                content: new Buffer.from(cal.toString()),
                'content-disposition': 'attachment'
            }]
        }

        if (req.files)
            req.files.map(file => {
                email.attachments.push({
                    filename: file.originalname,
                    content: file.buffer
                })
            })

        app.service('mailer').create(email)
        const interview = await app.service('jobs/resume/interview').create({
            jobsResumeId: req.body.jobsResumeId,
            interviewDate: req.body.interviewDate,
            interviewDuration: req.body.interviewDuration,
            jobLocation: req.body.jobLocation,
            workingHour: req.body.workWeekHours,
            typeOfHire: req.body.typeOfHire,
            expectedSalary: req.body.expectedSalary,
            availability: req.body.availability,
            personName: req.body.personName,
            personDesignation: req.body.personDesignation,
            personTel: req.body.personTel,
            interviewerName: req.body.interviewerName,
            interviewerDesignation: req.body.interviewerDesignation,
            interviewerTel: req.body.interviewerTel,
            remarks: req.body.remarks,
            address: req.body.address,
            docsNeeded: req.body.docsNeeded,
            interviewMode: req.body.interviewMode,
            tips: req.body.tips,
            jobResponsibility: req.body.jobResponsibility,
            createdAt: new Date(),

        }).catch(_e => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })

        return res.status(200).send(interview)
    })

    // Initialize our service with any options it requires
    app.use('/jobs/resume/interview', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/resume/interview')

    service.hooks(hooks)
}
