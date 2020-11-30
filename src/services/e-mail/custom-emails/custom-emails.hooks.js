import { authenticate } from '@feathersjs/authentication'
import ejs from 'ejs'
import path from 'path'
import { iff, isProvider, fastJoin, disallow } from 'feathers-hooks-common'
import JwtDecode from 'jwt-decode'

import { sendMail } from '../../../utils'
import CONSTANT from '../../../constant'

import { paginateAcceptFalse, createdBy, updatedBy } from '../../../hooks'

const customEmail = {
    joins: {
        sentByUser: (..._args) => async (customEmail, context) =>  customEmail.sentByUser = customEmail.sentBy ? await context.app.service('rms-users-info').findOne({
            query: {
                userId: customEmail.sentBy,
                $select: ['id', 'companyId', 'userId', 'firstName', 'lastName', 'signEmail']
            }
        }).catch(_e => { return null }) : null,
        createdByUser: (..._args) => async (customEmail, context) => customEmail.createdByUser = customEmail.createdBy ? await context.app.service('rms-users-info').findOne({
            query: {
                userId: customEmail.createdBy,
                $select: ['id', 'companyId', 'userId', 'firstName', 'lastName', 'signEmail']
            }
        }).catch(_e => { return null }) : null,
        updatedByUser: (..._args) => async (customEmail, context) => customEmail.updatedByUser = customEmail.updatedBy ? await context.app.service('rms-users-info').findOne({
            query: {
                userId: customEmail.updatedBy,
                $select: ['id', 'companyId', 'userId', 'firstName', 'lastName', 'signEmail']
            }
        }).catch(_e => { return null }) : null,
    }
}

//TODO Disable custom mail
// eslint-disable-next-line no-unused-vars
const sendCustomMail = (options = {}) => {
    return async context => {
        if(context.data.sendToUsers)
            lookingForUser(context)
        return context
    }
}

const lookingForUser = async (context) => {
    const { emailType, emailContent, userType } = context.data

    const banner = await context.app.service('cms/single-content').get('logo').catch(_e => { return null })
    const html = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.ALERTS.CUSTOM_EMAIL), {
        emailContent,
        portalUrl: process.env.JOB_PORTAL_URL,
        edmLogo: `${process.env.AWS_ENDPOINT}${CONSTANT.CRMS_BUCKET}/arms/cms/ad/${banner.content}`,
        emailType: parseInt(emailType, 10)
    }).catch(_e => { return null })

    if(html && banner) {
        // get all portal users
        let step = 30
        let skip = 0

        // count total user in the system
        const sequelize = await context.app.get('sequelizeClient')
        let query = 'SELECT COUNT(id) from users_system_roles'
        const userTypeInt = parseInt(userType, 10)
        // filter query by jobseeker
        if (userTypeInt === 1 || userTypeInt === 3) {
            query += ' WHERE system_role_id = 2'
        }

        // filter query by employer user
        if (userTypeInt === 2) {
            query += ' WHERE system_role_id IN (7, 8, 10, 11)'
        }

        // filter query by all user
        if (userTypeInt === 4) {
            query += ' WHERE system_role_id IN (2, 7, 8, 10, 11)'
        }

        const total = await sequelize.query(query).then(result => {
            return parseInt(result[0][0].count, 10)
        }).catch(_e => { return 0 })

        if (total) {
            while (skip < total) {
                let userSystemRolesId = await context.app.service('users/system-roles').find({
                    query: {
                        systemRoleId: { // Get UserType
                            $in: CONSTANT.CUSTOM_USER_TYPE(userType)
                        },
                        userId: {
                            $ne: null
                        },
                        $skip: skip,
                        $limit: step,
                        $select: ['userId']
                    },
                    paginate: false
                }).then(result => {
                    return result.map(({ userId }) => userId)
                }).catch(_e => {
                    return []
                })

                skip += step

                if(userSystemRolesId.length)
                    await sendMailToUsers(context, html, userSystemRolesId, userTypeInt)
            }
        }
    }
}

const sendMailToUsers = async (context, html, userSystemRolesId, userTypeInt) => {
    const users = await context.app.service('users').find({
        query: {
            id: {
                $in: userSystemRolesId
            },
            email: {
                $ne: null
            },
            isActive: userTypeInt === 3 ? 0 : 1,
            $select: ['id', 'email']
        },
        paginate: false
    }).catch(_e => { return [] })

    if(users.length)
        users.map(async user => {
            const email = {
                from: context.data.emailFrom,
                // to: user.email,
                to: ['anhdh.bhsoft@gmail.com'],
                subject: context.data.emailSubject,
                html
            }

            sendMail(email)
        })
}

const setSentDate = () => async context => {
    if(context.data.sendToUsers) {
        const decodeToken = JwtDecode(context.params.authentication.accessToken)

        context.data.sentBy = decodeToken.userId
        context.data.sentDate = new Date()
    }
    return context
}

export default {
    before: {
        all: [iff(isProvider('external'), authenticate('jwt'))],
        find: [paginateAcceptFalse()],
        get: [],
        create: [
            setSentDate(),
            createdBy()
        ],
        update: [disallow('external')],
        patch: [
            setSentDate(),
            updatedBy()
        ],
        remove: []
    },

    after: {
        all: [iff(isProvider('external'), fastJoin(customEmail))],
        find: [],
        get: [],
        create: [
            sendCustomMail()
        ],
        update: [],
        patch: [
            sendCustomMail()
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
