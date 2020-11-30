// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import JwtDecode from 'jwt-decode'
import _ from 'lodash'
import { NotAuthenticated, BadRequest } from '@feathersjs/errors'
import { Op } from 'sequelize'

import CONSTANT from '../../../constant'
import { dynamicSort } from '../../../utils'

// eslint-disable-next-line no-unused-vars
export const jobsFts = (options = {}) => {
    return async context => {
        if (context.data.sectorId || context.data.companyId || context.data.position) {
            const sequelize = context.app.get('sequelizeClient')
            let sectorName = context.data.sectorId ? context.result.sector?.name : null
            let companyName = context.data.companyId ? context.result.company?.name : null
            let jobPosition = context.data.position ? context.result?.position : null
            let workCountryName = context.data.workCountry ? context.result.workCountry?.name : null

            let tsArray = [context.result.id]
            if (sectorName) {
                sectorName = sectorName === 'IT' ? 'Information Technology' : sectorName
                tsArray.push(sectorName)
            }
            if (companyName) tsArray.push(companyName)
            if (jobPosition) tsArray.push(jobPosition)
            if (workCountryName) tsArray.push(workCountryName)

            const tsString = tsArray.join(' ')
            await sequelize.query(`UPDATE jobs SET "fullTextSearch" = to_tsvector('simple', '${tsString}') WHERE id = ${context.result.id}`)
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const jobHistory = (options = {}) => {
    return async context => {
        if (context.method === 'find' || context.method === 'get' || context.method === 'remove') return context
        else {
            let decodeToken
            try {
                decodeToken = JwtDecode(context.params.authentication.accessToken)
            } catch (err) {
                throw new NotAuthenticated('INVALID_TOKEN')
            }

            let jobHistory = {
                jobId: context.result.id,
                remark: context.data.remark ? context.data.remark : null,
                newStatus: context.data.isActive ? context.data.isActive : null,
                newJobStatusId: context.result.statusId,
                assignedTo: context.result.assignedTo,
                updatedBy: decodeToken.userId
            }

            if (context.method === 'create') {
                jobHistory.change = 5
                jobHistory.remark = 'Job is successfully added'

                await context.app.service('jobs/updated-logs').create(jobHistory)
            }

            if (context.method === 'patch' || context.method === 'updated') {
                const oldJob = context.params.jobs

                if ('statusId' in context.data && context.data.statusId !== oldJob?.statusId) {
                    if (context.data.statusId === 239) { // open
                        // re-new re-open date
                        await context.app.service('jobs').patch(context.result.id, {
                            openDate: new Date()
                        }).catch(_e => { return true })
                        jobHistory.change = 1
                    }
                    else jobHistory.change = 2
                    await context.app.service('jobs/updated-logs').create(jobHistory)
                } else if (context.data.isActive && context.data.isActive !== oldJob?.isActive) {
                    jobHistory.change = 4
                    await context.app.service('jobs/updated-logs').create(jobHistory)
                } else if (('nationalityId' in context.data && context.data.nationalityId !== oldJob?.nationalityId) ||
                    ('educationId' in context.data && context.data.educationId !== oldJob?.educationId) ||
                    ('experience' in context.data && context.data.experience !== oldJob?.experience) ||
                    ('sectorId' in context.data && context.data.sectorId !== oldJob?.sectorId) ||
                    ('prefResidentialStatus' in context.data && context.data.prefResidentialStatus !== oldJob?.prefResidentialStatus) ||
                    ('prefGender' in context.data && context.data.prefGender !== oldJob?.prefGender)
                ) {
                    jobHistory.change = 6
                    jobHistory.remark = context.data.remarks
                    await context.app.service('jobs/updated-logs').create(jobHistory)
                } else {
                    jobHistory.change = 0
                    await context.app.service('jobs/updated-logs').create(jobHistory)
                }
            }

            if (context.method === 'remove') {
                jobHistory.change = 3
                await context.app.service('jobs/updated-logs').create(jobHistory)
            }

            return context
        }
    }
}

// eslint-disable-next-line no-unused-vars
export const jobsCredits = (options = {}) => {
    return async context => {
        if (context.type === 'before') {
            const companyId = context.data.companyId
            const jobsCredit = await context.app.service('jobs/credits').findOne({
                query: {
                    companyId: companyId
                }
            }).catch(_e => { return null })
            const remainPoint = parseInt(jobsCredit.creditPoints, 10) - parseInt(jobsCredit.creditUsages, 10)
            if (String(remainPoint) === '0') {
                throw new BadRequest('OUT_OF_CREDITS')
            } else {
                context.params.jobsCredit = jobsCredit
            }
        }

        if (context.type === 'after') {
            const jobsCredit = context.params.jobsCredit
            context.app.service('jobs/credits').patch(jobsCredit.id, {
                creditUsages: parseInt(jobsCredit.creditUsages, 10) + 1
            })

            const companies = await context.app.service('companies').get(context.result.companyId, {
                query: {
                    $select: ['id', 'creditLeft']
                }
            })

            context.app.service('companies').patch(companies.id, {
                creditLeft: parseInt(companies.creditLeft, 10) - 1
            })
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const creditUsage = (options = {}) => {
    return async context => {
        context.app.service('companies').patch(context.result.companyId, {
            creditLeft: parseInt(context.result.creditPoints, 10) - parseInt(context.result.creditUsages, 10)
        })
    }
}

// eslint-disable-next-line no-unused-vars
export const checkExistJobResume = (options = {}) => {
    return async context => {
        context.params.jobsResume = await context.app.service('jobs/resume').get(context.data.jobsResumeId).catch(_e => {
            throw new BadRequest('JOB_RESUME_NOT_EXISTED')
        })
    }
}

// eslint-disable-next-line no-unused-vars
export const totalHotJob = (options = {}) => {
    return async context => {
        const sequelize = context.app.get('sequelizeClient')

        let query = '', condition = ''

        if (context.params.query.id) {
            const idArray = context.params.query.id ? context.params.query.id.$in : null
            if (typeof context.params.query.id !== 'object' && !Array.isArray(idArray)) {
                query += condition + `"id" = ${context.params.query.id}`
                condition = CONSTANT.QUERY_AND
            }

            if (Array.isArray(idArray)) {
                if(idArray.length > 0)
                    query += condition + `"id" IN (${context.params.query.id.$in.join(',')})`
                else
                    query += condition + '"id" IS NULL'

                condition = CONSTANT.QUERY_AND
            }
        }

        if (context.params.query.position) {
            query += condition + `"position" iLike '${context.params.query.position.$iLike}'`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.statusId) {
            query += condition + `"statusId" = '${context.params.query.statusId}'`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.hiringType) {
            query += condition + `"hiringType" = ${context.params.query.hiringType}`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.flag) {
            query += condition + `"flag" iLike '%${context.params.query.flag}%'`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.projectId) {
            query += condition + `"projectId" = ${context.params.query.projectId}`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.isPortalJob) {
            query += condition + `"isPortalJob" = ${context.params.query.isPortalJob}`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.hiringType) {
            query += condition + `"hiringType" = ${context.params.query.hiringType}`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.companyId) {
            const { companyId } = context.params.query
            let companyArray = companyId.$in ? '(' : companyId
            if (companyId.$in)
                for (let i = 0; i < companyId.$in.length; i++) {
                    companyArray += i === companyId.$in.length - 1 ? `${companyId.$in[i]})` : `${companyId.$in[i]}, `
                }
            query += condition + `"companyId" ${companyId.$in ? 'IN' : '='} ${companyArray}`
            condition = CONSTANT.QUERY_AND
        }

        if (context.params.query.sectorId) {
            const { sectorId } = context.params.query
            let sectorArray = sectorId.$in ? '(' : sectorId
            if (sectorId.$in)
                for (let i = 0; i < sectorId.$in.length; i++) {
                    sectorArray += i === sectorId.$in.length - 1 ? `${sectorId.$in[i]})` : `${sectorId.$in[i]}, `
                }
            query += condition + `"sectorId" ${sectorId.$in ? 'IN' : '='} ${sectorArray}`
            condition = CONSTANT.QUERY_AND
        }

        const arrayFieldQuery = ['isPortalJob', 'hiringType', 'companyId', 'sectorId', 'id', 'flag', 'position', 'statusId', 'projectId'] // avoiding duplicate key from above
        for (let key in context.params.query) {
            if (key[0] !== '$' && // remove the default alias such as $limit - $skip
                !Array.isArray(context.params.query[key]) && // all array cases are filter above
                arrayFieldQuery.indexOf(key) === -1 && // did not match in array (if match, it could duplicate)
                typeof context.params.query[key] !== 'object' // filter cases key using alias &&
            ) {
                query += condition + `"${key}" = '${context.params.query[key]}'`
                condition = CONSTANT.QUERY_AND
            }

            if (typeof context.params.query[key] === 'object') { // filter cases using alias
                const filed = context.params.query[key]
                if (filed.$ne) { // $ne case
                    query += condition + `"${key}" != ${filed.$ne}`
                    condition = CONSTANT.QUERY_AND
                }
            }
        }

        query += condition + '"isHotJob" = true'
        context.result.totalHotJob = await sequelize.query(`SELECT COUNT(*) FROM jobs WHERE ${query}`).then(result => {
            return result[0][0]
        }).catch(_e => { return true })

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const jobsJoinSequelize = (options = {}) => {
    return async context => {
        if (!context.params.sequelize) context.params.sequelize = {}
        const sequelize = context.params.sequelize
        sequelize.raw = true
        sequelize.include = [{
            model: context.app.services['sectors'].Model,
            as: 'sectors',
            attributes: ['id', 'name']
        }, {
            model: context.app.services['currencies'].Model,
            as: 'currencies',
            attributes: ['id', 'name']
        }, {
            model: context.app.services['projects'].Model,
            as: 'project',
            attributes: ['id', 'name', 'website', 'address1']
        }, {
            model: context.app.services['job-statuses'].Model,
            as: 'jobStatuses',
            attributes: ['id', 'name']
        }, {
            model: context.app.services['nationalities'].Model,
            as: 'nationalities',
            attributes: ['id', 'name']
        }, {
            model: context.app.services['educations'].Model,
            as: 'educations',
            attributes: ['id', 'name']
        }, {
            model: context.app.services['locations/sub'].Model,
            as: 'locationsSub',
            attributes: ['id', 'name']
        }, {
            model: context.app.services['locations'].Model,
            as: 'workCountryLocation',
            attributes: ['id', 'name', 'abbreviation']
        }]
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const jobsAddKeyJoin = (options = {}) => {
    return async context => {
        if (context.params.query.position && typeof context.params.query.position !== 'object')
            context.params.query.position = { $iLike: `%${context.params.query.position}%` }

        const keyJoin = ['sectorName', 'salaryCurrency', 'projectName', 'inOut', 'lastSubmitted', 'statusName']
        if (context.params.query.$sort) {
            context.params.sortJoin = {}
            keyJoin.map(condition => {
                const key = context.params.query.$sort[condition]
                if (key) {
                    context.params.sortJoin[condition] = context.params.query.$sort[condition]
                    delete context.params.query.$sort[condition]
                }
            })
        }
    }
}

// eslint-disable-next-line no-unused-vars
export const queryTempUser = (options = {}) => {
    return async context => {
        if (context.params.query?.tempUserId) {
            context.params.userId = context.params.query.tempUserId
            delete context.params.query.tempUserId
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const updateJobStatus = (options = {}) => {
    return async context => {
        // const sequelize = context.app.get('sequelizeClient')
        // await sequelize.query(`
        //     UPDATE jobs SET flag = 'grey' WHERE jobs.id IN (
        //         SELECT jobs.id from jobs join jobs_resume ON jobs.id = jobs_resume.job_id WHERE jobs_resume.status IN (5,8,9)
        //     );
        //     UPDATE jobs SET flag = 'blue' WHERE jobs.id IN (
        //         SELECT jobs.id from jobs join jobs_resume ON jobs.id = jobs_resume.job_id WHERE jobs_resume.status IN (4)
        //     );
        //     UPDATE jobs SET flag = 'red' WHERE jobs.id IN (
        //         SELECT jobs.id from jobs join jobs_resume ON jobs.id = jobs_resume.job_id WHERE jobs_resume.status IN (6,7)
        //     );
        // `)
        const jobResumeStatus = (await context.app.service('jobs/resume').find({
            query: {
                jobId: context.result.jobId,
                $select: ['status']
            },
            paginate: false
        })).map(({ status }) => status)

        const redFlag = [6, 7]
        const blueFlag = [4]
        const greyFlag = [5, 8, 9]

        let flag = null
        if (_.intersection(jobResumeStatus, greyFlag).length > 0) {
            flag = 'grey'
        }
        if (_.intersection(jobResumeStatus, blueFlag).length > 0) {
            flag = 'blue'
        }
        if (_.intersection(jobResumeStatus, redFlag).length > 0) {
            flag = 'red'
        }

        context.app.service('jobs').patch(context.result.jobId, { flag })

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const sortField = (options = {}) => {
    return async context => {
        let sortIndex
        let sortValue
        switch (options) {
            case 'sumInOut':
                if (context.params.sortJoin?.inOut) {
                    sortIndex = context.params.sortJoin.inOut
                    context.result.data.map(e => {
                        e.sumInOut = e.in + e.out
                    })
                    switch (sortIndex) {
                        case '1':
                            sortValue = 'sumInOut'
                            break
                        case '-1':
                            sortValue = '-sumInOut'
                            break
                        default:
                            throw new BadRequest('UNKNOWN_OPERATOR_SORT')
                    }
                    context.result.data.sort(dynamicSort(sortValue))
                }
                break
            default:
                if (context.params.sortJoin && context.params.sortJoin[options]) {
                    sortIndex = context.params.sortJoin[options]
                    switch (sortIndex) {
                        case '1':
                            sortValue = options
                            break
                        case '-1':
                            sortValue = `-${options}`
                            break
                        default:
                            throw new BadRequest('UNKNOWN_OPERATOR_SORT')
                    }
                    context.result.data = context.result.data.sort(dynamicSort(sortValue))
                }
                break
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const joinStatusJobResume = (options = {}) => {
    return async context => {
        if (context.params.query.jobStatusId) {
            if (!context.params.sequelize) context.params.sequelize = {}
            const sequelize = context.params.sequelize
            sequelize.raw = true
            sequelize.include = [{
                model: context.app.services['jobs'].Model,
                as: 'jobs',
                where: {
                    statusId: context.params.query.jobStatusId
                },
                attributes: []
            }]

            delete context.params.query.jobStatusId
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const fromDateToDate = (options = {}) => {
    return async context => {
        context.params.query.$and = context.params.query.$and || []

        if (context.params.query.fromDate) {
            context.params.query.$and.push({
                submittedOn: {
                    $gte: context.params.query.fromDate
                }
            })
            delete context.params.query.fromDate
        }

        if (context.params.query.toDate) {
            context.params.query.$and.push({
                submittedOn: {
                    $lte: context.params.query.toDate
                }
            })
            delete context.params.query.toDate
        }

        return context
    }
}

function checkHotColdList(jobResume) {
    const { resume, job } = jobResume

    let hotList = false
    if (job.nationalityId) {
        if (job.nationalityId === resume.nationalityId) hotList = true
        else return false
    }

    if (job.prefGender) {
        if (job.prefGender === resume.gender) hotList = true
        else return false
    }

    if (job.experience) {
        if (job.experience <= resume.workExpTotal) hotList = true
        else return false
    }

    if (job.educationId) {
        if (job.educationId === resume.educationId) hotList = true
        else return false
    }

    return hotList
}

// eslint-disable-next-line no-unused-vars
export const filterSubmittedResume = (options = {}) => {
    return async context => {
        if (context.type === 'before') {
            if (context.params.query.list && context.params.query.jobId && context.params.query.isPortalResume) { // check in case of call loop
                // if (context.params.query.isPortalResume === 'true') {
                //     const listJobResume = await context.app.service('jobs/resume').find({
                //         query: {
                //             jobId: context.params.query.jobId,
                //             consultantId: null,
                //             isNominated: false,
                //             // isApproved: 1,
                //             $select: ['resumeId']
                //         },
                //         paginate: false
                //     })
                //         .then(result => {
                //             const cleanedResume = result.filter(obj => {
                //             //get filter by count *in conditional
                //                 return obj.resume?.companyId
                //                 && obj.resume?.rootResumeId
                //             //&& obj.resume?.userId
                //             })

                //             return cleanedResume.map(({ resumeId }) => resumeId)
                //         })
                //         .catch(_e => { return [] })

                //     context.params.query.resumeId = {
                //         $in: [...new Set(listJobResume)]
                //     }
                // }

                context.params.isPortalResume = true
                delete context.params.query.isPortalResume
            }
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const hotListColdList = (options = {}) => {
    return async context => {
        if (context.type === 'before') {
            if (context.params.query.list) {
                context.params.list = context.params.query.list
                delete context.params.query.list
            }
        }

        if (context.type === 'after') {
            // exist list and only work for no pagination
            if (Array.isArray(context.result) && context.params.list) {
                const { list } = context.params
                context.result = context.result.filter(jobResume => {
                    // check hot - cold list
                    const isHotList = checkHotColdList(jobResume)
                    return list === 'all' || list === 'hot' && isHotList || list === 'cold' && !isHotList
                })

                const listJr = context.result.map(async jobResume => {
                    const { resume, job } = jobResume
                    const listJobSkill = await context.app.service('jobs/skills').find({
                        query: {
                            jobId: job.id,
                            $select: ['name']
                        },
                        paginate: false
                    }).then(result => {
                        return result.map(({ name }) => name)
                    })

                    if (resume.resumeStripSearch) {
                        const strip = resume.resumeStripSearch.toLowerCase()
                        let countSkill = 0
                        listJobSkill.map(name => {
                            const skill = name.toLowerCase()
                            const count = strip.split(skill).length - 1
                            countSkill += count
                        })

                        jobResume.rankingSkill = countSkill
                    }

                    //* check isNominatedJobResume
                    jobResume.isNominatedToJob = await context.app.service('jobs/resume').find({
                        query: {
                            jobId: jobResume.jobId,
                            resumeId: jobResume.resumeId,
                            isApproved: 1,
                            consultantId: {
                                $ne: null
                            },
                            $select: ['id'],
                            $limit: 1
                        },
                        paginate: false
                    }).then(result => {
                        return result.length > 0 ? true : false
                    }).catch(_e => {
                        return false
                    })

                    return jobResume
                })
                const result = await Promise.all(listJr)
                context.result = result
            }
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const findDuplicateResumeCrms = (options = {}) => {
    return async context => {
        if (context.params.isPortalResume && Array.isArray(context.result)) {
            const assignDuplicateResume = await context.result.map(async jobResume => {
                const { resume } = jobResume

                // check if is already sync to rms resume -> auto skip find rms resume
                const checkResume = await context.app.service('resume').get(resume.rootResumeId, {
                    query: {
                        $select: ['userId', 'companyId', 'rootResumeId']
                    }
                }).catch(_e => { return null })

                if (!checkResume || (checkResume && checkResume.companyId && checkResume.rootResumeId))
                    return jobResume

                // find all email value of user
                let listEmail = []
                if (resume.user && resume.user.email) {
                    listEmail.push(resume.user.email)
                }

                const listResumeContact = await context.app.service('resume/contacts').find({
                    query: {
                        resumeId: resume.id,
                        category: 3,
                        $select: ['value']
                    },
                    paginate: false
                }).then(result => {
                    return result.map(({ value }) => value)
                }).catch(_e => { return [] })

                if (listResumeContact.length > 0) {
                    listEmail = listEmail.concat(listResumeContact)
                }

                let listResumeDuplicate = []
                let  listResumeDuplicateContent = []
                if(resume.resumeHashContent) {
                    /**
                     * find all resume duplicate content with the cloned resume
                     */
                    listResumeDuplicateContent = await context.app.service('resume').find({
                        query: {
                            userId: null,
                            companyId: resume.companyId,
                            rootResumeId: null,
                            resumeHashContent: resume.resumeHashContent
                        },
                        paginate: false
                    }).then(dupResume => {
                        return dupResume.length > 0 ? dupResume.map(r => {
                            r.isDuplicateContent = true
                            return r
                        }) : []
                    }).catch(_e => { return [] })
                }

                if (listResumeDuplicateContent.length > 0) {
                    listResumeDuplicate = listResumeDuplicate.concat(listResumeDuplicateContent)
                }
                /**
                 * 1. find all email value in resume contact
                 * 2. filter result to get resume uploaded by rms -> isDuplicateEmail = true
                 */
                const listResumeDuplicateEmail = await context.app.service('resume/contacts').find({
                    query: {
                        resumeId: {
                            [Op.notIn]: listResumeDuplicateContent.map(({id}) => id)
                        },
                        value: {
                            $in: listEmail
                        },
                        category: 3,
                        $select: ['resumeId']
                    },
                    paginate: false
                }).then(async resumeContact => {
                    if(resumeContact.length > 0) {
                        const listResume = await context.app.service('resume').find({
                            query: {
                                $and: [{
                                    id: {
                                        $in: resumeContact.map(({ resumeId }) => resumeId)
                                    }
                                }, {
                                    id: {
                                        $ne: resume.id
                                    }
                                }],
                                userId: null,
                                companyId: resume.companyId,
                                rootResumeId: null
                            },
                            paginate: false
                        }).then(dupResume => {
                            return dupResume.map(r => {
                                r.isDuplicateEmail = true
                                return r
                            })
                        }).catch(_e => { return [] })

                        return listResume
                    }  else {
                        return []
                    }
                }).catch(_e => { return [] })

                if (listResumeDuplicateEmail.length > 0) {
                    listResumeDuplicate = listResumeDuplicate.concat(listResumeDuplicateEmail)
                }

                // assign value to jobResume then return
                jobResume.listResumeDuplicate = listResumeDuplicate
                return jobResume
            })

            context.result = await Promise.all(assignDuplicateResume)
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const removeJob = (options = {}) => {
    return async context => {
        const { id } = context

        await context.app.service('jobs/coowners').remove(null, {
            query: {
                jobId: id
            }
        })

        await context.app.service('jobs/educations').remove(null, {
            query: {
                jobId: id
            }
        })

        await context.app.service('jobs-later-views').remove(null, {
            query: {
                jobId: id
            }
        })

        await context.app.service('jobs/project-contacts').remove(null, {
            query: {
                jobId: id
            }
        })

        const listJobResumeId = await context.app.service('jobs/resume').find({
            query: {
                jobId: id,
                $select: ['id']
            },
            paginate: false
        }).then(result => {
            return result.map(({ id }) => id)
        })

        await Promise.all(listJobResumeId.map(async jrId => {
            await context.app.service('jobs/resume').remove(jrId)
        }))

        await context.app.service('jobs/sectors/filter').remove(null, {
            query: {
                jobId: id
            }
        })

        await context.app.service('jobs/skills').remove(null, {
            query: {
                jobId: id
            }
        })

        await context.app.service('jobs/updated-logs').remove(null, {
            query: {
                jobId: id
            }
        })
    }
}

