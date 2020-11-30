// Initializes the `cms-news-events` service on path `/cms/news-events`
import createService from 'feathers-sequelize'
import createModel from '../../../models/cms/cms-news-events.model'
import hooks from './cms-news-events.hooks'

import JwtDecode from 'jwt-decode'
import { NotAuthenticated, GeneralError, BadRequest } from '@feathersjs/errors'
import md5 from 'md5'
import multer from 'multer'
import { scheduleJob } from 'node-schedule'
import path from 'path'
import ejs from 'ejs'
import moment from 'moment-timezone'
import _ from 'lodash'

import CONSTANT from '../../../constant'
import { s3Crms as s3 } from '../../../utils'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['patch']
    }

    app.post('/cms/news-events/upload-image/:eventId', multer({}).single('file'), async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        // validate role ARMS
        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId']
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })
        if (_.intersection(CONSTANT.VALIDATE_ROLE_ARMS, rmsUser.user.role).length === 0) return res.status(400).send(new BadRequest('USER_NOT_ALLOWED'))

        const event = await app.service('cms/news-events').get(req.params.eventId).catch(_e => { return null })
        s3.createBucket(() => {
            const imagePath = `${md5(Date.now())}.${req.file.originalname.split('.').pop()}`
            s3.upload({
                client: s3,
                Bucket: CONSTANT.CRMS_BUCKET,
                Key: `arms/cms/news/${imagePath}`,
                Body: req.file.buffer,
                ACL: 'public-read'
            }, async (err, _data) => {
                if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                await app.service('cms/news-events').patch(event.id, {
                    imagePath
                }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })
                res.status(200).send(JSON.stringify({ state: true, imagePath }))
            })
        })
    })

    app.get('/cms/news-events/unsubscribe/:resumeId', async (req, res) => {
        const resume = await app.service('resume').get(req.params.resumeId).catch(_e => {
            return res.status(500).send(new GeneralError('RESUME_ID_NOT_EXISTED'))
        })

        await app.service('resume').patch(resume.id, {
            isNewsLetterSubscribe: 0
        }).catch(_e => { return true })

        return res.status(200).send({ isNewsLetterSubscribe: resume.isNewsLetterSubscribe })
    })
    // Initialize our service with any options it requires
    app.use('/cms/news-events', createService(options))

    // Auto suspense
    function setSchedule() {
        // schedule will start at 0am each day
        return scheduleJob('0 0 0 * * *', () => {
            app.service('cms/news-events').patch(null, {
                isActive: 0
            }, {
                query: {
                    endDate: {
                        $lt: new Date()
                    }
                }
            }).catch(_e => {
                return true
            })
        })
    }

    setSchedule()

    //TODO Disable news event alerts
    function sendNewsEventNotification() {
        // schedule at 7am each day
        return scheduleJob('0 0 7 * * *', async () => {
            const banner = await app.service('cms/single-content').get('logo').catch(_e => {return null})

            // find news event
            const newsEventList = await app.service('cms/news-events').find({
                query: {
                    startDate: {
                        $eq: moment(new Date()).format('YYYY-MM-DD')
                    }
                },
                paginate: false
            }).catch(_e => { return [] })

            const newsEventMapping = newsEventList.map(async newsEvent => {
                // get list User resume
                const listResume = await app.service('resume').find({
                    query: {
                        isNewsLetterSubscribe: 1,
                        isActive: 1,
                        userId: {
                            $ne: null
                        },
                        companyId: null,
                        rootResumeId: null,
                        $select: ['id', 'userId', 'firstName']
                    },
                    paginate: false
                }).catch(_e => { return [] })

                const sendNewsEventToUser = listResume.map(async resume => {
                    /**
                     * get all email from users
                     */
                    let listUserEmail = []

                    // login-email
                    if (resume['users.email']) {
                        listUserEmail.push(resume['users.email'])
                    }

                    // email in resume contacts
                    const listResumeContacts = await app.service('resume/contacts').find({
                        query: {
                            resumeId: resume.id,
                            category: 3,
                            $select: ['value']
                        },
                        paginate: false
                    }).then(contacts => {
                        return contacts.map(({ value }) => value)
                    }).catch(_e => { return [] })
                    if (listResumeContacts.length > 0) {
                        listUserEmail = listUserEmail.concat(listResumeContacts)
                    }

                    let token
                    try {
                        token = await app.service('authentication').createAccessToken({
                            resumeId: resume.id,
                        }, CONSTANT.TOKEN_OPTIONS.PATCH_JOB_RESUME_TOKEN, CONSTANT.TOKEN_SECRET)
                    } catch (_e) {
                        return true
                    }

                    //!----------------------Get news event template
                    const unsubscribeLink = process.env.JOB_PORTAL_URL + `/unsubscribe/news-events?token=${token}`

                    // get template news event
                    const newsEventTemplate = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.ALERTS.NEWS_EVENT_ALERT), {
                        edmLogo: `${process.env.AWS_ENDPOINT}${CONSTANT.CRMS_BUCKET}/arms/cms/ad/${banner.content}`,
                        user: resume.firstName,
                        eventImage: `${process.env.AWS_ENDPOINT}/${CONSTANT.CRMS_BUCKET}/arms/cms/news/${newsEvent.imagePath}`,
                        heading: newsEvent.heading,
                        description: newsEvent.description,
                        startDate: moment(newsEvent.startDate).format('DD-MMM-YYYY'),
                        endDate: moment(newsEvent.endDate).format('DD-MMM-YYYY'),
                        unsubscribeLink,
                        portalUrl: process.env.JOB_PORTAL_URL
                    }).catch(_e => { return null })
                    if (listUserEmail.length > 0 && newsEventTemplate) {
                        const email = {
                            from: `${CONSTANT.FROM_EMAIL.NEWS_EVENT}`,
                            // to: listUserEmail,
                            to: ['anhdh.bhsoft@gmail.com', 'quannh1.bhsoft@gmail.com', 'sendra@thebluebarrel.com.sg'],
                            subject: 'The Bluebox News Letter Events',
                            html: newsEventTemplate,
                        }
                        app.service('mailer').create(email).catch(_e => {
                            return true
                        })
                    }
                })

                await Promise.all(sendNewsEventToUser)
            })

            return await Promise.all(newsEventMapping)
        })
    }

    sendNewsEventNotification()

    // Get our initialized service so that we can register hooks
    const service = app.service('cms/news-events')

    service.hooks(hooks)
}
