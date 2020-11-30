import ejs from 'ejs'
import path from 'path'
import _ from 'lodash'

import CONSTANT from '../../../constant'

export default async function (type, user, notifierOptions, app) {
    function getLink(type, hash, email, portal) {
        email = email.replace(/\+/g, '%2B')
        let portalURL
        switch (portal) {
            case CONSTANT.LOGIN_PORTAL.JOB_SEEKER:
                portalURL = process.env.JOB_PORTAL_URL
                break
            case CONSTANT.LOGIN_PORTAL.CRMS:
                portalURL = process.env.CRMS_URL
                break
            case CONSTANT.LOGIN_PORTAL.ARMS:
                portalURL = process.env.ARMS_URL
                break
            default:
                portalURL = process.env.JOB_PORTAL_URL
                break
        }
        let url = `${portalURL}/${type}?token=${hash}&email=${email}`
        if (type === 'forgot-password') url = `${portalURL}/${type}?token=${hash}`
        return url
    }

    function sendEmail(email) {
        return app.service('mailer').create(email)
    }

    function readJobPortalTemplate({ firstName = '', lastName = '', title, p1 = '', p2 = '', p3 = '', p4 = '', url = '', btnName = '', loginCredentials = {}, urls = {} }) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const data = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.JOB_PORTAL_TEMPLATE), { firstName, lastName, title, p1, p2, p3, p4, url, btnName, loginCredentials, urls, portalUrl: process.env.JOB_PORTAL_URL })
                resolve(data)
            } catch (error) {
                reject(error)
            }
        })
    }

    const verifyToken = user.verifyToken

    const pathToQuery = _.intersection(user.role, CONSTANT.VALIDATE_ROLE_JS).length > 0 ? 'resume' : 'rms-users-info'
    const targetUser = await app.service(pathToQuery).findOne({
        query: {
            userId: user.id
        }
    }).catch(_err => { return { firstName: null, lastName: null } })
    const { firstName, lastName } = targetUser

    let tokenLink
    let email
    let data

    const isJsUser = _.includes(user.role, ...CONSTANT.VALIDATE_ROLE_JS)
    const isARMSUser = _.includes(user.role, ...CONSTANT.VALIDATE_ROLE_ARMS)
    switch (type) {
        case 'resendVerifySignup': //sending the user the verification email
            tokenLink = getLink('verify-account', verifyToken, user.email.toLowerCase(), CONSTANT.LOGIN_PORTAL.JOB_SEEKER)
            data = await readJobPortalTemplate({
                firstName,
                lastName,
                title: 'Your Bluebox account is almost complete',
                p1: 'Thank you for creating a Job Seeker account with Bluebox.Jobs.',
                p2: 'Bluebox.Jobs is a meeting point for employers and job seekers. Employers trying to seek for the right candidate and job seekers seeking for a job opportunity where they can excel in their career path as a professional.',
                p3: 'Please click below to verify your email address in order to complete your account setup.',
                url: tokenLink,
                btnName: 'Verify Email'
            })
            email = {
                from: CONSTANT.FROM_EMAIL.DEFAULT ? `${CONSTANT.FROM_EMAIL.DEFAULT} <${process.env.SMTP_USER_NO_REPLY}>`: process.env.SMTP_USER_NO_REPLY,
                to: user.email.toLowerCase(),
                subject: 'Verify Signup',
                html: data
            }
            return sendEmail(email)

        case 'sendResetPwd': {
            const portal = isJsUser ? CONSTANT.LOGIN_PORTAL.JOB_SEEKER : isARMSUser ? CONSTANT.LOGIN_PORTAL.ARMS : CONSTANT.LOGIN_PORTAL.CRMS
            const portalUrl = isJsUser ? process.env.JOB_PORTAL_URL : isARMSUser ? process.env.ARMS_URL : process.env.CRMS_URL
            tokenLink = getLink('forgot-password', user.resetToken, user.email.toLowerCase(), portal)
            data = await readJobPortalTemplate({
                firstName,
                lastName,
                title: 'Password Recovery',
                p1: `We received a request to reset your password for your ${portalUrl} account.`, //split('\\/\\/')[1]
                p2: 'Simply click on the below link to set a new password.',
                p4: 'If you didn\'t ask to change your password or you have done this by mistake. Kindly ignore/delete this email because your email is still safe with us.',
                url: tokenLink,
                btnName: 'Recover Password'
            })
            email = {
                from: CONSTANT.FROM_EMAIL.DEFAULT ? `${CONSTANT.FROM_EMAIL.DEFAULT} <${process.env.SMTP_USER_NO_REPLY}>`: process.env.SMTP_USER_NO_REPLY,
                to: user.email.toLowerCase(),
                subject: 'Reset Password',
                html: data
            }
            return sendEmail(email)
        }
        case 'resetPwd':
            tokenLink = getLink('reset', user.resetToken, user.email.toLowerCase(), 'jobPortal')
            email = {}
            return {}

        case 'passwordChange':
            email = {}
            return {}

        case 'identityChange':
            tokenLink = getLink('verifyChanges', verifyToken, user.email.toLowerCase(), 'jobPortal')
            email = {}
            return {}

        case 'sendLoginCredentials':
            data = await readJobPortalTemplate({
                firstName,
                lastName,
                loginCredentials: {
                    email: user.email.toLowerCase(),
                },
                urls: {
                    blueboxRecruiterUrl: process.env.CRMS_URL,
                    jobPortalUrl: process.env.JOB_PORTAL_URL
                },
                title: 'Bluebox: Account Created Successfully',
                p4: `For any further assistance, please contact us at: ${process.env.BLUEBOX_EMAIL || 'example@email.com'}`,
                url: tokenLink,
                btnName: ''
            })
            email = {
                from: CONSTANT.FROM_EMAIL.DEFAULT ? `${CONSTANT.FROM_EMAIL.DEFAULT} <${process.env.SMTP_USER_NO_REPLY}>`: process.env.SMTP_USER_NO_REPLY,
                to: user.email.toLowerCase(),
                subject: 'Bluebox: Account Created Successfully',
                html: data
            }
            return sendEmail(email)
        default:
            break
    }
}
