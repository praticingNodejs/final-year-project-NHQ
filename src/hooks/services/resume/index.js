// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import JwtDecode from 'jwt-decode'
import { BadRequest, NotAuthenticated } from '@feathersjs/errors'
import _ from 'lodash'

import CONSTANT from '../../../constant'
import { s3Crms, s3Js, stripObject } from '../../../utils'

// eslint-disable-next-line no-unused-vars
export const createResume = (options = {}) => {
    return async context => {
        //Create resume
        let resumeUserCreator
        resumeUserCreator = stripObject(context.data, [
            'id', 'email', 'googleId', 'facebookId', 'linkedinId', 'password', 'passwordToken', 'role', 'systemRoleId', 'createdAt', 'sectors', 'lastPosition',
            'updatedAt', 'isVerified', 'verifyToken', 'verifyExpires', 'resetToken', 'resetExpires', 'verifyShortToken', 'verifyChanges', 'isAspMembership', 'isLocked'
        ])
        resumeUserCreator.userId = context.result.id
        resumeUserCreator.availability = null
        context.result.resume = await context.app.service('resume').create(resumeUserCreator)

        //Create resume-sectors
        context.result.resumeSectors = []
        for (let i = 0; i < context.data.sectors.length; i++) {
            let resumeSectorsCreator = { resumeId: context.result.resume.id, sectorId: context.data.sectors[i] }
            await context.app.service('resume/sectors').create(resumeSectorsCreator).then(resumeSectors => {
                context.result.resumeSectors.push(resumeSectors)
            }).catch(_e => { return true })
        }

        //Create resume-work-experience
        let resumeExperienceCreator
        resumeExperienceCreator = context.data.lastPosition
        resumeExperienceCreator.resumeId = context.result.resume.id
        await context.app.service('resume/work-experience').create(resumeExperienceCreator).then(lastPosition => {
            context.result.lastPosition = lastPosition
        }).catch(_e => { return true })

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const cloneResume = (options = {}) => {
    return async context => {
        let resumeAfterClone = null
        const { isExistRmsResume, job, resume, rmsResume } = await context.params

        if (resume.userId !== null && !resume.companyId) {
            if (!isExistRmsResume) {
                if (resume && job) {
                    const cloneResume = {
                        userId: resume.userId,
                        firstName: resume.firstName,
                        lastName: resume.lastName,
                        contactHome: resume.contactHome,
                        residentialAddress: resume.residentialAddress,
                        gender: resume.gender,
                        dob: resume.dob,
                        passportNo: resume.passportNo,
                        nationalityId: resume.nationalityId,
                        nationalityOther: resume.nationalityOther,
                        sgpResidentialStatus: resume.sgpResidentialStatus,
                        currentLocationId: resume.currentLocationId,
                        empStatus: resume.empStatus,
                        availability: resume.availability,
                        salaryAmount: resume.salaryAmount,
                        salaryFreq: resume.salaryFreq,
                        salaryIsSgd: resume.salaryIsSgd,
                        salaryCurrency: resume.salaryCurrency,
                        otherBenefits: resume.otherBenefits,
                        expSalaryAmount: resume.expSalaryAmount,
                        expSalaryFreq: resume.expSalaryFreq,
                        expSalaryIsSgd: resume.expSalaryIsSgd,
                        expSalaryCurrency: resume.expSalaryCurrency,
                        showSalary: resume.showSalary,
                        expOtherBenefits: resume.expOtherBenefits,
                        otherRemarks: resume.otherRemarks,
                        remarks: resume.remarks,
                        educationId: resume.educationId,
                        educationalAward: resume.educationalAward,
                        postalCode: resume.postalCode,
                        streetAddress: resume.streetAddress,
                        streetAddress2: resume.streetAddress2,
                        instNameLoc: resume.instNameLoc,
                        gradYear: resume.gradYear,
                        facultyId: resume.facultyId,
                        awards: resume.awards,
                        otherQualifications: resume.otherQualifications,
                        careerSummary: resume.careerSummary,
                        achievements: resume.achievements,
                        workExpTotal: resume.workExpTotal,
                        workExpRelevant: resume.workExpRelevant,
                        resumeDetail: resume.resumeDetail,
                        resumePath: resume.resumePath,
                        resumePdfPath: resume.resumePdfPath,
                        resumeHashContent: resume.resumeHashContent,
                        referResume: resume.referResume,
                        photoPath: resume.photoPath,
                        isApproved: resume.isApproved,
                        policyAccepted: resume.policyAccepted,
                        originalResumeName: resume.originalResumeName,
                        resumeStripSearch: resume.resumeStripSearch,
                        ftsStripSearch: resume.ftsStripSearch,
                        registerDeviceType: resume.registerDeviceType,
                        isPolicyApproved: resume.isPolicyApproved,
                        isUnsubscribe: resume.isUnsubscribe,
                        employmentDetail: resume.employmentDetail,
                        employmentRemark: resume.employmentRemark,
                        unsubscribedOn: resume.unsubscribedOn,
                        profileStatus: resume.profileStatus,
                        deactivationReason: resume.deactivationReason,
                        deactivationComments: resume.deactivationComments,
                        isProfileComplete: resume.isProfileComplete,
                        isNewsLetterSubscribe: resume.isNewsLetterSubscribe,
                        isJobAlertsSubscribe: resume.isJobAlertsSubscribe,
                        isProfileUpdateAlertSubscribe: resume.isProfileUpdateAlertSubscribe,
                        isMyProfileViewsAlertSubscribe: resume.isMyProfileViewsAlertSubscribe,
                        isAllowSearch: resume.isAllowSearch,
                        linkedIn: resume.linkedIn,
                        facebook: resume.facebook,
                        twitter: resume.twitter,
                        regLoginUserType: resume.regLoginUserType,
                        isPushNotificationsSubscribed: resume.isPushNotificationsSubscribed,
                        expShowSalary: resume.expShowSalary,
                        expRmsSalaryMin: resume.expRmsSalaryMin,
                        expRmsSalaryMax: resume.expRmsSalaryMax,
                        expRmsIsNegotiable: resume.expRmsIsNegotiable,
                        reasonLeaving: resume.reasonLeaving,
                        contractStart: resume.contractStart,
                        contractEnd: resume.contractEnd,
                        isBlacklisted: resume.isBlacklisted,
                        blacklistReason: resume.blacklistReason,
                        hiringType: resume.hiringType,
                        isActive: resume.isActive,
                        showImageInPdf: resume.showImageInPdf,
                        agencyRates: resume.agencyRates,
                        agencyComments: resume.agencyComments,
                        consultantsRemarks: resume.consultantsRemarks,
                        companyId: job.companyId,
                        roleId: resume.roleId,
                        disciplineId: resume.disciplineId,
                        rankId: resume.rankId,
                        createdBy: resume.createdBy?.id,
                        updatedBy: resume.updatedBy?.id,
                        rootResumeId: resume.id
                    }

                    //* Clone a resume
                    resumeAfterClone = await context.app.service('resume').create(cloneResume).catch(_e => {
                        return null
                    })

                    //* -----------------generate resume/contacts
                    const resumeContact = await context.app.service('resume/contacts').find({
                        query: {
                            resumeId: resume.id,
                            $select: ['category', 'value']
                        },
                        paginate: false
                    })

                    resumeContact.map(obj => {
                        obj.resumeId = resumeAfterClone.id
                        context.app.service('resume/contacts').create(obj)
                    })
                    // -----------------------------------------

                    //* -----------------generate resume/sectors
                    const resumeSectors = await context.app.service('resume/sectors').find({
                        query: {
                            resumeId: resume.id,
                            $select: ['sectorId']
                        },
                        paginate: false
                    })

                    resumeSectors.map(obj => {
                        obj.resumeId = resumeAfterClone.id
                        context.app.service('resume/sectors').create(obj)
                    })
                    // -----------------------------------------

                    //* -----------------generate resume/messengers
                    const resumeMessengers = await context.app.service('resume/messengers').find({
                        query: {
                            resumeId: resume.id,
                            $select: ['messengerType', 'messengerAccount']
                        },
                        paginate: false
                    })

                    resumeMessengers.map(obj => {
                        obj.resumeId = resumeAfterClone.id
                        context.app.service('resume/messengers').create(obj)
                    })
                    // -----------------------------------------

                    //* -----------------generate resume/work-experience
                    const resumeWorkExperiences = await context.app.service('resume/work-experience').find({
                        query: {
                            resumeId: resume.id,
                            $select: ['periodFrom', 'periodTo', 'presentDate', 'company', 'division', 'divisionApplicable', 'position', 'duties', 'countInRelatedExp']
                        },
                        paginate: false
                    })

                    resumeWorkExperiences.map(obj => {
                        obj.resumeId = resumeAfterClone.id
                        context.app.service('resume/work-experience').create(obj)
                    })
                    // -----------------------------------------
                }
            }

            if (resume.resumePath) {
                s3Js.getObject({
                    Bucket: CONSTANT.BUCKET,
                    Key: `${CONSTANT.RESUME_AWS_FOLDER}${resume.resumePath}`
                }, async (_err, data) => {
                    s3Crms.createBucket(() => {
                        s3Crms.upload({
                            Bucket: CONSTANT.CRMS_BUCKET,
                            Key: `${job.company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}${resume.resumePath}`,
                            Body: data.Body
                        }).promise()
                    })
                })
            }

            if (resume.photoPath) {
                s3Js.getObject({
                    Bucket: CONSTANT.BUCKET,
                    Key: `${CONSTANT.AVATAR_AWS_FOLDER}${resume.photoPath}`,
                }, async (_err, data) => {
                    s3Crms.createBucket(() => {
                        s3Crms.upload({
                            Bucket: CONSTANT.CRMS_BUCKET,
                            Key: `${job.company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}image/${resume.photoPath}`,
                            Body: data.Body,
                            ACL: 'public-read'
                        }).promise()
                    })
                })
            }

            //* Clone another jobs - resume match to cloned-resume
            context.app.service('jobs/resume').create({
                resumeId: resumeAfterClone ? resumeAfterClone.id : rmsResume.id,
                jobId: job.id,
                isApproved: 1
            })
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const autoPatchCloneResume = (options = {}) => {
    return async context => {
        if (typeof context.data === 'object') {
            if (context.result.companyId === null && context.result.rootResumeId === null) {
                const resumeToPatch = {
                    firstName: context.result.firstName,
                    lastName: context.result.lastName,
                    contactHome: context.result.contactHome,
                    residentialAddress: context.result.residentialAddress,
                    gender: context.result.gender,
                    dob: context.result.dob,
                    passportNo: context.result.passportNo,
                    nationalityId: context.result.nationalityId,
                    nationalityOther: context.result.nationalityOther,
                    sgpResidentialStatus: context.result.sgpResidentialStatus,
                    currentLocationId: context.result.currentLocationId, //old db: current_location
                    empStatus: context.result.empStatus,
                    availability: context.result.availability,
                    salaryAmount: context.result.salaryAmount,
                    salaryFreq: context.result.salaryFreq,
                    salaryIsSgd: context.result.salaryIsSgd,
                    salaryCurrency: context.result.salaryCurrency,
                    otherBenefits: context.result.otherBenefits,
                    expSalaryAmount: context.result.expSalaryAmount,
                    expSalaryFreq: context.result.expSalaryFreq,
                    expSalaryIsSgd: context.result.expSalaryIsSgd,
                    expSalaryCurrency: context.result.expSalaryCurrency,
                    showSalary: context.result.showSalary,
                    expOtherBenefits: context.result.expOtherBenefits,
                    otherRemarks: context.result.otherRemarks,
                    remarks: context.result.remarks,
                    educationId: context.result.educationId,
                    educationalAward: context.result.educationalAward,
                    postalCode: context.result.postalCode,
                    streetAddress: context.result.streetAddress,
                    streetAddress2: context.result.streetAddress2,
                    instNameLoc: context.result.instNameLoc,
                    gradYear: context.result.gradYear,
                    facultyId: context.result.deactivationReason,
                    awards: context.result.awards,
                    otherQualifications: context.result.otherQualifications,
                    careerSummary: context.result.careerSummary,
                    achievements: context.result.achievements,
                    workExpTotal: context.result.workExpTotal,
                    workExpRelevant: context.result.workExpRelevant,
                    referResume: context.result.referResume,
                    isApproved: context.result.isApproved,
                    policyAccepted: context.result.policyAccepted,
                    registerDeviceType: context.result.registerDeviceType,
                    isPolicyApproved: context.result.isPolicyApproved,
                    isUnsubscribe: context.result.isUnsubscribe,
                    // employmentDetail: context.result.employmentDetail,
                    // employmentRemark: context.result.employmentRemark,
                    unsubscribedOn: context.result.unsubscribedOn,
                    profileStatus: context.result.profileStatus,
                    deactivationReason: context.result.deactivationReason,
                    deactivationComments: context.result.deactivationComments,
                    isProfileComplete: context.result.isProfileComplete,
                    isNewsLetterSubscribe: context.result.isNewsLetterSubscribe,
                    isJobAlertsSubscribe: context.result.isJobAlertsSubscribe,
                    isProfileUpdateAlertSubscribe: context.result.isProfileUpdateAlertSubscribe,
                    isMyProfileViewsAlertSubscribe: context.result.isMyProfileViewsAlertSubscribe,
                    isAllowSearch: context.result.isAllowSearch,
                    linkedIn: context.result.linkedIn,
                    facebook: context.result.facebook,
                    twitter: context.result.twitter,
                    regLoginUserType: context.result.regLoginUserType,
                    isPushNotificationsSubscribed: context.result.isPushNotificationsSubscribed,
                    expShowSalary: context.result.expShowSalary,
                    expRmsSalaryMin: context.result.expRmsSalaryMin,
                    expRmsSalaryMax: context.result.expRmsSalaryMax,
                    expRmsIsNegotiable: context.result.expRmsIsNegotiable,
                    reasonLeaving: context.result.reasonLeaving,
                    contractStart: context.result.contractStart,
                    contractEnd: context.result.contractEnd,
                    isBlacklisted: context.result.isBlacklisted,
                    blacklistReason: context.result.blacklistReason,
                    hiringType: context.result.hiringType,
                    isActive: context.result.isActive,
                    showImageInPdf: context.result.showImageInPdf,
                    agencyRates: context.result.agencyRates,
                    agencyComments: context.result.agencyComments,
                    consultantsRemarks: context.result.consultantsRemarks,
                    roleId: context.result.roleId,
                    disciplineId: context.result.disciplineId,
                    rankId: context.result.rankId,
                    createdBy: context.result.createdBy,
                    updatedBy: context.data.updatedBy,
                    createdAt: context.result.createdAt,
                    updatedAt: context.result.updatedAt,
                    isPortalResume: context.result.isPortalResume
                }

                context.app.service('resume').patch(null, resumeToPatch, {
                    query: {
                        rootResumeId: context.id
                    }
                })
            }
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const autoPatchCloneResumeService = (options = {}) => {
    return async context => {
        if (Array.isArray(context.data) && context.data.length > 0) {
            if (context.data[0]?.resumeId) {
                // get list resumeClone id
                const listResumeClone = await context.app.service('resume').find({
                    query: {
                        rootResumeId: context.data[0].resumeId,
                        companyId: {
                            $ne: null
                        },
                        $select: ['id']
                    },
                    paginate: false
                }).then(result => {
                    return result.map(({ id }) => id)
                })

                // remove all service in those id
                await context.app.service(context.path).remove(null, {
                    query: {
                        resumeId: {
                            $in: listResumeClone
                        }
                    }
                }).catch(_e => { return [] })

                // find All sub service of original resume id
                let resumeSubService = await context.app.service(context.path).find({
                    query: {
                        resumeId: context.data[0].resumeId
                    },
                    paginate: false
                })

                listResumeClone.map(resumeCloneId => {
                    const data = resumeSubService.map(obj => {
                        obj.resumeId = resumeCloneId
                        delete obj.id
                        return obj
                    })

                    data.map(async service => {
                        await context.app.service(context.path).create(service)
                    })
                })
            }
        }

        if (context.method === 'remove') {
            if (context.type === 'before' && context.id && !Array.isArray(context.id)) {
                const resumeService = await context.app.service(context.path).get(context.id)
                context.params.resumeService = resumeService
            }

            if (context.type === 'after' && context.id && !Array.isArray(context.id)) {
                const { resumeId } = context.params.resumeService
                if (resumeId) {
                    // get list resumeClone id
                    const listResumeClone = await context.app.service('resume').find({
                        query: {
                            rootResumeId: resumeId,
                            companyId: {
                                $ne: null
                            },
                            $select: ['id']
                        },
                        paginate: false
                    }).then(result => {
                        return result.map(({ id }) => id)
                    })

                    // remove all service in those id
                    await context.app.service(context.path).remove(null, {
                        query: {
                            resumeId: {
                                $in: listResumeClone
                            }
                        }
                    }).catch(_e => { return [] })

                    // find All sub service of original resume id
                    let resumeSubService = await context.app.service(context.path).find({
                        query: {
                            resumeId: resumeId
                        },
                        paginate: false
                    })

                    listResumeClone.map(resumeCloneId => {
                        const data = resumeSubService.map(obj => {
                            obj.resumeId = resumeCloneId
                            delete obj.id
                            return obj
                        })

                        data.map(async service => {
                            await context.app.service(context.path).create(service)
                        })
                    })
                }
            }
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const removeResume = (options = {}) => {
    return async context => {
        await context.app.service('resume/contacts').remove(null, {
            query: {
                resumeId: context.id
            }
        })
        await context.app.service('resume/documents').remove(null, {
            query: {
                resumeId: context.id
            }
        })
        await context.app.service('resume/edit-reason').remove(null, {
            query: {
                resumeId: context.id
            }
        })
        await context.app.service('resume/messengers').remove(null, {
            query: {
                resumeId: context.id
            }
        })
        await context.app.service('resume/sectors').remove(null, {
            query: {
                resumeId: context.id
            }
        })
        await context.app.service('resume/work-experience').remove(null, {
            query: {
                resumeId: context.id
            }
        })
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const resumeCreateByRms = (options = {}) => {
    return async context => {
        let decodeToken

        try {
            decodeToken = JwtDecode(context.params.authentication.accessToken)
        } catch (err) {
            throw new NotAuthenticated('INVALID_TOKEN')
        }

        const rmsUser = await context.app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'companyId']
            }
        })

        if (rmsUser.companyId === null && !context.data.companyId)
            throw new BadRequest('RESUME_CREATED_BY_ARMS_MUST_HAVE_COMPANY_ID')

        context.data.companyId = rmsUser.companyId || context.data.companyId
        context.data.createdBy = rmsUser.userId

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const resumeDesignationToRole = (options = {}) => {
    return async context => {
        if (context.data.designationId) {
            context.data.roleId = context.data.designationId
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const resumeFts = (options = {}) => {
    return async context => {
        const sequelize = await context.app.get('sequelizeClient')
        const resume = context.result

        sequelize.query(`
            UPDATE resume SET fts_strip_search = to_tsvector('simple',
                (SELECT
                    CONCAT (
                        (SELECT email FROM users WHERE id = resume.user_id), ' ',
                        resume.first_name, ' ',
                        resume.last_name, ' ',
                        resume.resume_strip_search
                    ) AS text
                )
            )  WHERE id = ${resume.id}
        `)
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const resumeEditReason = (options = {}) => {
    return async context => {
        if (context.data.reason)
            context.app.service('resume/edit-reason').create({
                resumeId: context.id,
                reason: context.data.reason,
                updatedBy: context.data.updatedBy
            })

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const resumeDocuments = (options = {}) => {
    return async context => {
        const resume = await context.app.service('resume').get(context.result.resumeId, {
            query: {
                $select: ['id', 'companyId']
            }
        }).catch(_e => { return null })

        const companyUrl = resume.company?.companyUrl
        s3Crms.deleteObject({
            Bucket: CONSTANT.CRMS_BUCKET,
            Key: `${companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}other/${context.result.docPath}`,
        })

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const resumeAddKeyJoin = (options = {}) => {
    return async context => {
        let keyJoin = ['educationName', 'residentialStatusName']
        if (context.params.query.$sort) {
            context.params.sortJoin = {}
            keyJoin.map(condition => {
                let key = context.params.query.$sort[condition]
                if (key) {
                    context.params.sortJoin[condition] = context.params.query.$sort[condition]
                    delete context.params.query.$sort[condition]
                }
            })
        }
    }
}

// eslint-disable-next-line no-unused-vars
export const resumeJoinSequelize = (options = {}) => {
    return async context => {
        if (!context.params.sequelize) context.params.sequelize = {}

        const sequelize = context.params.sequelize
        sequelize.raw = true
        sequelize.include = [{
            model: context.app.services['educations'].Model,
            as: 'education',
            attributes: ['id', 'name']
        }, {
            model: context.app.services['sgp-residential-status'].Model,
            as: 'residentialStatus',
            attributes: ['id', 'name']
        }, {
            model: context.app.services['users'].Model,
            as: 'users',
            attributes: ['id', 'email']
        }]

        if (context.params.query.email) {
            const resumeEmail = context.params.query.email
            delete context.params.query.email

            const { rmsUser } = context.params
            const sequelizeClient = await context.app.get('sequelizeClient')
            const user = await sequelizeClient.query(`
                SELECT users.id FROM resume
                JOIN users ON resume.user_id = users.id
                ${rmsUser.companyId ? 'WHERE resume.company_id = ' + rmsUser.companyId : ''}
                AND users.email = '${resumeEmail}'
            `).then(result => {
                return result[0][0]
            }).catch(_e => { return null })

            // if exist js -> get js
            if (user && user.id)
                context.params.query.userId = user.id
            // else find in resume contacts
            else
                sequelize.include.push({
                    model: context.app.services['resume/contacts'].Model,
                    as: 'resumeContacts',
                    where: {
                        category: 3,
                        value: {
                            $iLike: `%${resumeEmail}%`
                        }
                    },
                    attributes: []
                })
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const resumeMapDuplicate = (options = {}) => {
    return async context => {
        if (context.result.data)
            context.result.data = [...new Map(context.result.data.map(item => [item['id'], item])).values()]
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const findRms = (options = {}) => {
    return async context => {
        if (context.params.authentication && context.params.authentication.accessToken) {
            const decodeToken = await JwtDecode(context.params.authentication.accessToken)
            const rmsUser = await context.app.service('rms-users-info').findOne({
                query: {
                    userId: decodeToken.userId
                }
            }).catch(_e => { throw new BadRequest('USER_NOT_EXISTED') })

            context.params.rmsUser = rmsUser
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const findJobResume = (options = {}) => {
    return async context => {
        context.params.jobsResume = await context.app.service('jobs/resume').get(context.data.jobsResumeId).catch(_e => { throw new BadRequest('JOBS_RESUME_NOT_EXISTED') })
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const validateResumeViewer = (options = {}) => {
    return async context => {
        if (context.params.rmsUser) {
            const rmsUser = context.params.rmsUser
            if (rmsUser.companyId) {
                if (context.method === 'find')
                    context.params.query.companyId = rmsUser.companyId

                if (context.method === 'get') {
                    if (!context.result.companyId)
                        return context

                    if (context.result.companyId === rmsUser.companyId) {
                        return context
                    } else {
                        throw new BadRequest('USER_NOT_ALLOWED')
                    }
                }
            }
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const checkDuplicateResumeContact = (options = {}) => {
    return async context => {
        if (!Array.isArray(context.data)) {
            const resumeContact = await context.app.service('resume/contacts').findOne({
                query: {
                    resumeId: context.data.resumeId,
                    value: context.data.value,
                    category: context.data.category
                }
            })

            if (resumeContact) throw new BadRequest('RESUME_CONTACT_EXISTED')
        } else {
            context.data.map(async contact => {
                const resumeContact = await context.app.service('resume/contacts').findOne({
                    query: {
                        resumeId: contact.resumeId,
                        value: contact.value,
                        category: contact.category
                    }
                })

                if (resumeContact) throw new BadRequest('RESUME_CONTACT_EXISTED')
            })
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const armsViewResume = (options = {}) => {
    return async context => {
        // check arms
        if (context.params.query.isArms) {
            // if not exist rmsUser (not authenticated) and not arms
            if (!context.params.rmsUser || _.intersection(context.params.rmsUser.user.role, CONSTANT.VALIDATE_ROLE_ARMS).length === 0) {
                throw new NotAuthenticated('USER_NOT_ALLOWED')
            }

            // filter resume original
            context.params.query.companyId = null
            context.params.query.rootResumeId = null
            context.params.query.userId = context.params.query.userId || {
                $ne: null
            }
            context.params.query.$select = ['id', 'userId', 'firstName', 'lastName', 'acceptTermDate', 'createdAt']

            // delete additional key
            delete context.params.query.isArms
        }

        return context
    }
}
