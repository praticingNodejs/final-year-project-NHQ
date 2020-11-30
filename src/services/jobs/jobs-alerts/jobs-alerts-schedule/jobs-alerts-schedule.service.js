import nodeSchedule from 'node-schedule'
import ejs from 'ejs'
import path from 'path'
import { Op } from 'sequelize'

import { sendMail } from '../../../../utils'
import CONSTANT from '../../../../constant'

export default async function (app) {
    // Send job alert mails every Friday at 7.am
    const scheduleAlerts = ({ hour: 7, minute: 0, dayOfWeek: 5, tz: 'Asia/Jakarta' })
    nodeSchedule.scheduleJob(scheduleAlerts, async function () {
        const activeCompany = await app.service('companies').find({
            query: {
                status: 1,
                $select: ['id']
            },
            paginate: false
        }).then(result => {
            return result.map(({ id }) => id)
        }).catch(_e => { return [] })
        const listJobs = await app.service('jobs').find({
            query: {
                $or: [{
                    createdAt: {
                        $gt: Date.now() - 1000 * 60 * 60 * 24 * 7 // last 7 days
                    }
                }, {
                    updatedAt: {
                        $gt: Date.now() - 1000 * 60 * 60 * 24 * 7 // last 7 days
                    }
                }],
                companyId: {
                    $in: activeCompany
                },
                isActive: 1,
                statusId: {
                    [Op.notIn]: [240, 244, 245, 2522] // not send to: Close - Cancelled - Successful (244 & 2522)
                }, // status open
                showInPortal: true,
                $sort: {
                    createdAt: -1
                },
                $select: ['id', 'position', 'sectorId', 'workCountry', 'companyId']
            },
            paginate: false
        }).catch(_e => { return [] })

        if(!listJobs.length) return true

        // get list of jobs alerts
        const jobAlerts = await app.service('jobs/alerts').find({
            query: {
                id: {
                    $gt: 10000
                }
            },
            paginate: false
        }).catch(_e => { return [] })

        if (jobAlerts && jobAlerts.length > 0) {
            jobAlerts.map(async alert => {
                /**
                 * 1. Get sectors and position
                 */
                // job-alert sector from each job alert
                const alertSectorList = app.service('jobs/alerts/sectors').find({
                    query: {
                        jobsAlertsId: alert.id,
                        $select: ['sectorId']
                    },
                    paginate: false
                }).catch(_e => { return [] })

                // job-alert position from each job alert
                const alertPositionList = app.service('jobs/alerts/positions').find({
                    query: {
                        jobsAlertsId: alert.id,
                        $select: ['position']
                    },
                    paginate: false
                }).catch(_e => { return [] })

                const [alertSectors, alertPositions] = await Promise.all([alertSectorList, alertPositionList])

                // if there are no position, return to the next element
                if(alertPositions.length === 0) return true

                const listSectorId = alertSectors.length > 0 ? alertSectors.map(({ sectorId }) => sectorId) : []
                const listPosition = alertPositions.map(({ position }) => position)

                /**
                 * 2. Build query to find job
                 */
                let jobs = listJobs
                // add sectors Id to jobs
                if (listSectorId.length)
                    listSectorId.map(jSector => {
                        jobs = jobs.filter(j => j.sectorId === jSector)
                    })

                // add position to jobs
                if (listPosition.length)
                    listPosition.map(jPos => {
                        jobs = jobs.filter(j => j.position.toLowerCase().includes(jPos.toLowerCase()))
                    })

                /**
                 * 3. Get list Jobs
                 */
                let { firstName, lastName, user } = alert

                // to authenticated users
                if (alert.userId) {
                    const targetUser = await app.service('resume').findOne({
                        query: {
                            userId: alert.userId,
                            isJobAlertsSubscribe: 1
                        }
                    }).catch(_e => { return null })

                    if (targetUser) {
                        firstName = targetUser.firstName
                        lastName = targetUser.lastName
                        user = targetUser.user
                    }
                }

                const jobAlertIdList = jobAlerts.filter(jAlert => user ? jAlert.userId === user.id : jAlert.email === alert.email )
                let unsubscribeAlertLink = process.env.JOB_PORTAL_URL

                // unsubscribe jobs alerts
                if (jobAlertIdList.length > 0) {
                    let token
                    try {
                        token = await app.service('authentication').createAccessToken({
                            jobAlertId: jobAlertIdList
                        }, CONSTANT.TOKEN_OPTIONS.PATCH_JOB_RESUME_TOKEN, CONSTANT.TOKEN_SECRET)
                    } catch (_e) {
                        return true
                    }

                    unsubscribeAlertLink += `/unsubscribe/job-alerts?token=${token}`
                }

                // get banner
                // const banner = await app.service('cms/single-content').get('logo').catch(_e => {return null})
                // sending alert
                if (jobs.length > 0) {
                    const html = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.ALERTS.JOB_ALERT), {
                        user: `${firstName || ''} ${lastName || ''}`,
                        firstName: firstName || '',
                        jobs: jobs,
                        unsubscribeAlertLink,
                        portalUrl: process.env.JOB_PORTAL_URL,
                        awsEndPoint: process.env.AWS_ENDPOINT,
                        crmsBucket: CONSTANT.CRMS_BUCKET,
                        awsCompanyLogo: CONSTANT.AWS_COMPANY_LOGO,
                        // edmLogo: `${process.env.AWS_ENDPOINT}${CONSTANT.CRMS_BUCKET}/arms/cms/ad/${banner.content}`,
                        edmLogo: ''
                    }).catch(_e => { return '' })

                    if (html) {
                        const email = {
                            from: `${CONSTANT.FROM_EMAIL.JOB_ALERT}`,
                            // to: alert.email,
                            to: ['anhdh.bhsoft@gmail.com', 'quannh1.bhsoft@gmail.com', 'sendra@thebluebarrel.com.sg'],
                            subject: `${firstName || 'Hello'}, see top matching jobs this week`,
                            html: html,
                        }

                        sendMail(email)
                    }
                }
            })
        }
    })
}
