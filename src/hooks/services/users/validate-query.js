import { BadRequest } from '@feathersjs/errors'
import _ from 'lodash'
import JwtDecode from 'jwt-decode'
import md5 from 'md5'

import CONSTANT from '../../../constant'

// eslint-disable-next-line no-unused-vars
export const validateUserFind = (options = {}) => {
    return async context => {
        if (context.params.query.userId && context.params.query.userId !== context.params.rmsUser.userId)
            throw new BadRequest('USER_NOT_ALLOWED')
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const deleteUserAccount = (options = {}) => {
    return async context => {
        const decodeToken = JwtDecode(context.params.authentication.accessToken)
        const currentUser = await context.app.service('users').get(decodeToken.userId).catch(_e => { throw new BadRequest('USER_NOT_EXISTED') })

        if (!context.id) {
            throw new BadRequest('ID_IS_NOT_PROVIDED')
        }

        const user = await context.app.service('users').get(context.id).catch(_e => { throw new BadRequest('USER_NOT_EXISTED') })

        const validateRoleJs = _.intersection(CONSTANT.VALIDATE_ROLE_JS, currentUser.role).length
        const deleteUserRoleJs = _.intersection(CONSTANT.VALIDATE_ROLE_JS, user.role).length

        if (validateRoleJs > 0 && deleteUserRoleJs > 0) {
            const resume = await context.app.service('resume').findOne({
                query: {
                    userId: user.id,
                    companyId: null,
                    rootResumeId: null
                }
            }).catch(_e => { return null })

            if (resume) {
                // SET null all resume
                context.app.service('resume').patch(resume.id, {
                    userId: null,
                    firstName: 'DELETED',
                    lastName: 'USER',
                    contactHome: null,
                    residentialAddress: null,
                    gender: null,
                    dob: null,
                    passportNo: null,
                    nationalityId: null,
                    nationalityOther: null,
                    sgpResidentialStatus: null,
                    currentLocationId: null,
                    empStatus: null,
                    availability: null,
                    salaryAmount: null,
                    salaryFreq: null,
                    salaryIsSgd: null,
                    salaryCurrency: null,
                    otherBenefits: null,
                    expSalaryAmount: null,
                    expSalaryFreq: null,
                    expSalaryIsSgd: null,
                    expSalaryCurrency: null,
                    showSalary: null,
                    expOtherBenefits: null,
                    otherRemarks: null,
                    remarks: null,
                    educationId: null,
                    educationalAward: null,
                    postalCode: null,
                    streetAddress: null,
                    streetAddress2: null,
                    instNameLoc: null,
                    gradYear: null,
                    facultyId: null,
                    awards: null,
                    otherQualifications: null,
                    careerSummary: null,
                    achievements: null,
                    workExpTotal: null,
                    workExpRelevant: null,
                    resumeDetail: null,
                    resumePath: null,
                    resumePdfPath: null, // oldDb: resume_path_1
                    resumeHashContent: null,
                    referResume: null,
                    photoPath: null,
                    isApproved: 0,
                    policyAccepted: null,
                    originalResumeName: null,
                    resumeStripSearch: null,
                    ftsStripSearch: null,
                    registerDeviceType: null,
                    isPolicyApproved: 0,
                    isUnsubscribe: 0,
                    employmentDetail: null,
                    employmentRemark: null,
                    unsubscribedOn: null,
                    //!!-------- keep deactivation reason
                    profileStatus: 3, // deleted account
                    // deactivationReason: resume.deactivationReason,
                    // deactivationComments: resume.deactivationComments,
                    //!!--------------------------------
                    isProfileComplete: 0,
                    isNewsLetterSubscribe: 0,
                    isJobAlertsSubscribe: 0,
                    isProfileUpdateAlertSubscribe: 0,
                    isMyProfileViewsAlertSubscribe: 0,
                    isAllowSearch: 0,
                    linkedIn: null,
                    facebook: null,
                    twitter: null,
                    regLoginUserType: null,
                    isPushNotificationsSubscribed: 0,
                    expShowSalary: 0,
                    expRmsSalaryMin: null,
                    expRmsSalaryMax: null,
                    expRmsIsNegotiable: null,
                    reasonLeaving: null,
                    contractStart: null,
                    contractEnd: null,
                    isBlacklisted: null,
                    blacklistReason: null,
                    hiringType: null,
                    isActive: 0,
                    showImageInPdf: null,
                    agencyRates: null,
                    agencyComments: null,
                    consultantsRemarks: null,
                    companyId: null,
                    roleId: null,
                    disciplineId: null,
                    rankId: null,
                    createdBy: null,
                    updatedBy: null,
                    rootResumeId: null,
                    pastEmploymentHistory: null,
                    isPortalResume: false
                })

                //---------Update users account
                // conflict with hashing password feathers-js hook
                const sequelizeClient = await context.app.get('sequelizeClient')
                await sequelizeClient.query(`
                    UPDATE users SET
                        email = 'DELETED_USER_${md5(Date.now())}_${user.id}',
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
                    WHERE id = '${user.id}'
                `)
                //------------------------------

                /**
                 * remove resume sub-service
                 */
                context.app.service('resume/contacts').remove(null, {
                    query: {
                        resumeId: resume.id
                    }
                }).catch(_e => { return true })
                context.app.service('resume/documents').remove(null, {
                    query: {
                        resumeId: resume.id
                    }
                }).catch(_e => { return true })
                context.app.service('resume/edit-reason').remove(null, {
                    query: {
                        resumeId: resume.id
                    }
                }).catch(_e => { return true })
                context.app.service('resume/messengers').remove(null, {
                    query: {
                        resumeId: resume.id
                    }
                }).catch(_e => { return true })
                context.app.service('resume/sectors').remove(null, {
                    query: {
                        resumeId: resume.id
                    }
                }).catch(_e => { return true })
                context.app.service('resume/work-experience').remove(null, {
                    query: {
                        resumeId: resume.id
                    }
                }).catch(_e => { return true })
                //---------------------------------

                //--------------Handle email in resume clone
                const resumeClone = await context.app.service('resume').find({
                    query: {
                        userId: {
                            $ne: null
                        },
                        companyId: {
                            $ne: null
                        },
                        rootResumeId: resume.id,
                        $select: ['id']
                    },
                    paginate: false
                }).catch(_e => { return [] })

                resumeClone.map(({ id }) => {
                    context.app.service('resume/contacts').create({
                        resumeId: id,
                        category: 3,
                        value: user.email
                    }).catch(_e => { return true })
                })

                // patch resume clone -> set null userId & rootResumeId
                context.app.service('resume').patch({
                    userId: null,
                    rootResumeId: null
                }, {
                    query: {
                        id: {
                            $in: resumeClone.map(({ id }) => id)
                        }
                    }
                })
                //---------------------------------
            }
            // return first found result
            context.result = user
            return context
        } else {
            throw new BadRequest('USER_NOT_ALLOWED')
        }
    }
}
