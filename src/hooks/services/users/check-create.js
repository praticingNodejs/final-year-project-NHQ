/* eslint-disable no-prototype-builtins */
// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { NotAcceptable, GeneralError, BadRequest, Forbidden, NotAuthenticated } from '@feathersjs/errors'
import _ from 'lodash'
import ejs from 'ejs'
import path from 'path'
import JwtDecode from 'jwt-decode'
import md5 from 'md5'

import { extractObject, stripObject } from '../../../utils'
import CONSTANT from '../../../constant'

// eslint-disable-next-line no-unused-vars
export const checkCreate = (options = {}) => {
    return async context => {
        let requiredFields
        switch (options) {
            case 'users': {
                await context.app.service('users').findOne({
                    query: {
                        email: context.data.email
                    }
                }).then(result => {
                    if(result) {
                        throw new BadRequest('USER_EXISTED')
                    }
                })

                requiredFields = [
                    'email', 'password', 'firstName', 'lastName', 'nationalityId',
                    'currentLocationId', 'sgpResidentialStatus', 'contactHome',
                    'educationId', 'workExpTotal', 'sectors', 'lastPosition'
                ]
                for (let i = 0; i < requiredFields.length; i++) {
                    if (!context.data.hasOwnProperty(requiredFields[i]))
                        throw new NotAcceptable('MISSING_REQUIRED_FIELD')
                }

                if (!Array.isArray(context.data.sectors) || context.data.sectors.length < 0)
                    throw new NotAcceptable('MISSING_REQUIRED_FIELD')

                if (context.data.lastPosition.length < 0 || !context.data.lastPosition.hasOwnProperty('position') || !context.data.lastPosition.hasOwnProperty('company'))
                    throw new NotAcceptable('MISSING_REQUIRED_FIELD')
            }
                break
            case 'rms_users': {
                requiredFields = ['firstName', 'lastName', 'email']

                if (_.includes(CONSTANT.VALIDATE_ROLE_CRMS, context.data.role)) {
                    requiredFields.push('companyId')
                    let password = Math.random().toString(36).substring(2)
                    context.data.password = password
                    context.data.passwordTemp = password
                }
                else if (_.includes(CONSTANT.VALIDATE_ROLE_ARMS, context.data.role)) {
                    requiredFields.push('password')
                    context.data.companyId = null
                }
                else
                    throw new BadRequest('ROLE_NOT_EXISTED')

                context.data.isVerified = true
            }
                break
            default:
                throw new GeneralError('CHECK_CREATE_UNDEFINED')
        }

        for (let field of requiredFields)
            if (!context.data.hasOwnProperty(field)) throw new NotAcceptable('MISSING_REQUIRED_FIELD')

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const checkCreateRmsRole = (options = {}) => {
    return async context => {
        let CONSTRAINT = CONSTANT.VALIDATE_CREATE_USER()
        let currentUserRole
        if (context.params.user)
            currentUserRole = await context.app.service('users/system-roles').find({
                query: {
                    userId: context.params.user.id,
                    $select: ['userId', 'systemRoleId']
                },
                paginate: false
            }).then(result => {
                return result.map(({ role }) => role)
            })
        else
            throw new NotAuthenticated('NOT_AUTHENTICATED')

        for (let constrain of CONSTRAINT) {
            if (_.includes(currentUserRole, constrain.role) && _.includes(constrain.allowCreate, context.data.role))
                return context
        }

        throw new Forbidden('ROLE_NOT_ALLOWED')
    }
}

// eslint-disable-next-line no-unused-vars
export const checkCreateUserRole = (options = {}) => {
    return async context => {
        let role = context.data.role || 'jobseeker'

        let systemRoles = await context.app.service('system-roles').find({
            query: {
                isActive: 1
            },
            paginate: false
        }).then(result => {
            return result.map(v => v.name)
        })

        if (!systemRoles.includes(role))
            throw new NotAcceptable('ROLE_NOT_EXISTED')

        return role === options ? true : false
    }
}

// eslint-disable-next-line no-unused-vars
export const checkIsPrimaryUser = (options = {}) => {
    return async context => {
        if (context.data.role === CONSTANT.VALIDATE_ROLE_CRMS[0] && !_.intersection(context.params.user.role, CONSTANT.VALIDATE_ROLE_ARMS).length === 0) {
            if (!context.data.companyId)
                throw new BadRequest('MISSING_FIELD_REQUIRED')

            const listAccountAdmin = await context.app.service('rms-users-info').find({
                query: {
                    companyId: context.data.companyId,
                    $select: ['userId']
                },
                paginate: false
            }).then(result => {
                return result.length > 0 ? result.filter(obj => _.includes(obj.user.role, CONSTANT.VALIDATE_ROLE_CRMS[0])) : []
            })

            if (listAccountAdmin >= 10) {
                throw new BadRequest('LIMIT_NUMBER_OF_ACCOUNT_ADMINISTRATOR')
            }

            const company = await context.app.service('companies').get(context.data.companyId, {
                query: {
                    $select: ['id', 'primaryUserId']
                }
            }).catch(_err => { throw new BadRequest('COMPANY_NOT_EXISTED') })

            if (context.data.isPrimaryUser && company.primaryUserId)
                throw new BadRequest('COMPANY_PRIMARY_USER_EXISTED')

            // Only allow primary users
            if (context.params.user?.id !== company.primaryUserId)
                throw new Forbidden('USER_NOT_ALLOWED')

        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const checkPatchCrmsRole = (options = {}) => {
    return async context => {
        if (context.data.role && context.data.currentRole)
            if (CONSTANT.VALIDATE_ROLE_CRMS.indexOf(context.data.role) > -1) {
                const currentRole = await context.app.service('system-roles').findOne({
                    query: {
                        name: context.data.currentRole
                    }
                })

                const role = await context.app.service('system-roles').findOne({
                    query: {
                        name: context.data.role
                    }
                })

                const currentUserRole = await context.app.service('users/system-roles').findOne({
                    query: {
                        systemRoleId: currentRole.id,
                        userId: context.data.targetUserId
                    }
                })

                if (currentUserRole)
                    await context.app.service('users/system-roles').patch(currentUserRole.id, {
                        systemRoleId: role.id
                    })

                return context
            } else
                throw new BadRequest('ROLE_NOT_EXISTED')
        else return context
    }
}

// eslint-disable-next-line no-unused-vars
export const createRole = (options = {}) => {
    return async context => {
        //Create resume
        let roleCreator
        roleCreator = extractObject(context.data, ['systemRoleId'])

        roleCreator.systemRoleId = roleCreator.systemRoleId || 2
        roleCreator.userId = context.result.id

        await context.app.service('users/system-roles').create(roleCreator).then(async role => {
            context.result.systemRoleId = role.systemRoleId
            context.result.role = [(await context.app.service('system-roles').get(role.systemRoleId)).name]
        })

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const createRmsUserInfo = (options = {}) => {
    return async context => {
        //Create rms-user-info
        let rmsUserInfoCreator = stripObject(context.data, [
            'id', 'email', 'googleId', 'facebookId', 'linkedinId', 'password', 'passwordToken', 'role', 'systemRoleId', 'createdAt', 'sectors', 'lastPosition',
            'updatedAt', 'isVerified', 'verifyToken', 'verifyExpires', 'resetToken', 'resetExpires', 'verifyShortToken', 'verifyChanges', 'isAspMembership', 'isLocked'
        ])
        rmsUserInfoCreator.userId = context.result.id
        rmsUserInfoCreator.signEmail = context.result.email
        context.result.rmsUserInfo = await context.app.service('rms-users-info').create(rmsUserInfoCreator)

        if (context.data.isPrimaryUser)
            await context.app.service('companies').patch(context.result.rmsUserInfo?.companyId, {
                primaryUserId: context.result.id
            })

        //Create user system role
        let usersSystemRoleCreator
        let roleId = (await context.app.service('system-roles').findOne({
            query: {
                name: context.data.role
            }
        })).id

        usersSystemRoleCreator = {
            systemRoleId: roleId,
            userId: context.result.id
        }
        await context.app.service('users/system-roles').create(usersSystemRoleCreator).then(role => context.result.role = role)
        context.result.password = context.data.passwordTemp

        if (_.includes(CONSTANT.VALIDATE_ROLE_CRMS, context.data.role)) {
            await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.CREATE_NEW_CRMS), {
                firstName: context.result.rmsUserInfo.firstName,
                lastName: context.result.rmsUserInfo.lastName,
                role: context.result.role.role,
                companyName: context.result.rmsUserInfo?.company?.name,
                email: context.result.email,
                password: context.result.password,
                recruiterURL: process.env.CRMS_URL,
                portalUrl: process.env.JOB_PORTAL_URL
            }, (_err, data) => {
                let email = {
                    from: CONSTANT.FROM_EMAIL.DEFAULT ? `${CONSTANT.FROM_EMAIL.DEFAULT} <${process.env.SMTP_USER}>` : process.env.SMTP_USER,
                    to: context.result.email,
                    subject: 'Bluebox: Account Created Successfully',
                    html: data
                }
                context.app.service('mailer').create(email)
            })
        }

        delete context.result['password']
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const removeRmsUsers = (options = {}) => {
    return async context => {
        await context.app.service('jobs/coowners').remove(null, {
            query: {
                consultantId: context.result.userId
            }
        })

        await context.app.service('jobs').patch(null, {
            assignedTo: null
        }, {
            query: {
                assignedTo: context.result.userId
            }
        })

        await context.app.service('jobs/resume').patch(null, {
            consultantId: null
        }, {
            query: {
                consultantId: context.result.userId
            }
        })

        await context.app.service('jobs/resume/visitor').remove(null, {
            query: {
                consultantId: context.result.userId
            }
        })

        // conflict with hashing password feathers-js hook
        const sequelizeClient = await context.app.get('sequelizeClient')
        await sequelizeClient.query(`
            UPDATE users
            SET
                email = 'DELETED_USER_${context.result.userId}_${md5(Date.now())}',
                google_id = null,
                facebook_id = null,
                linkedin_id = null,
                password = null,
                password_token = null,
                is_verified = false,
                password_salt = null,
                refresh_token = null,
                reset_password_token_url = null,
                is_active = 0
            WHERE id = '${context.result.userId}'
        `)

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const toLowerCaseEmail = (options = {}) => {
    return async context => {
        if (context.data?.email)
            context.data.email = context.data.email.toLowerCase()

        if (context.data.role === null || context.data.role === undefined)
            context.data.role === 'jobseeker'

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const createdBy = (options = {}) => {
    return async context => {
        const decodeToken = JwtDecode(context.params.authentication.accessToken)
        context.data.createdBy = decodeToken.userId
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const updatedBy = (options = {}) => {
    return async context => {
        const decodeToken = JwtDecode(context.params.authentication.accessToken)
        context.data.updatedBy = decodeToken.userId
        return context
    }
}
