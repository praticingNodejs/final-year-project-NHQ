// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import JwtDecode from 'jwt-decode'
import { BadRequest, GeneralError } from '@feathersjs/errors'
import _ from 'lodash'
import { Op } from 'sequelize'

import CONSTANT from '../../../constant'

// eslint-disable-next-line no-unused-vars
export const validateJobDetailViewer = (options = {}) => {
    return async context => {
        if (!context.params.authentication && context.method === 'get') return context
        else {
            const decodeToken = JwtDecode(context.params.authentication.accessToken)

            const userRole = (await context.app.service('users/system-roles').find({
                query: {
                    userId: decodeToken.userId
                },
                paginate: false
            })).map(({ systemRoleId }) => systemRoleId)

            switch (context.method) {
                case 'get':
                    if (!_.includes(userRole, 2)) {
                        const user = await context.app.service('rms-users-info').findOne({
                            query: {
                                userId: decodeToken.userId,
                                $select: ['id', 'companyId']
                            }
                        })

                        if (user.companyId !== context.result.companyId) throw new BadRequest('USER_NOT_ALLOWED')
                    }
                    break

                case 'update':
                case 'patch':
                case 'remove':
                    if (!_.includes(userRole, 2)) {
                        const user = await context.app.service('rms-users-info').findOne({
                            query: {
                                userId: decodeToken.userId,
                                $select: ['id', 'companyId']
                            }
                        })

                        const companyId = await context.app.service('jobs').get(context.id, {
                            query: {
                                $select: ['id', 'companyId']
                            }
                        }).then(result => {
                            return result.companyId
                        }).catch(_err => { throw new BadRequest('JOB_NOT_EXISTED') })

                        // if is arms or in the same crms
                        if(!user.companyId) {
                            return context
                        }

                        if (user.companyId && user.companyId !== companyId) {
                            throw new BadRequest('USER_NOT_ALLOWED')
                        }
                    }
                    break
                default: throw new GeneralError('ERR_CONNECTION')
            }
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const validateHiringManager = (options = {}) => {
    return async context => {
        if (context.params.authentication?.accessToken) {
            const decodeToken = JwtDecode(context.params.authentication.accessToken)
            const rmsUser = await context.app.service('rms-users-info').findOne({
                query: {
                    userId: decodeToken.userId,
                    $select: ['id', 'userId', 'companyId']
                }
            }).catch(_e => { return null })

            context.params.rmsUser = rmsUser

            if (_.includes(rmsUser?.user?.role, 'hiring manager')) {
                let condition = {
                    query: {
                        consultantId: decodeToken.userId,
                        $select: ['id', 'jobId']
                    },
                    paginate: false
                }

                if (context.method === 'get') {
                    condition.query.jobId = context.id
                }

                const jobsCoOwner = (await context.app.service('jobs/coowners').find(condition).catch(_e => { return [] })).map(({ jobId }) => jobId)
                context.params.query.id = {
                    $in: jobsCoOwner
                }
            }
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const jobsFilterAssignedTo = (options = {}) => {
    return async context => {
        if (context.params.query.assignedTo) {
            // get the params for query then delete key
            const assignedTo = context.params.query.assignedTo
            delete context.params.query.assignedTo

            /**
             * case 1: filter the un assigned to job
             */
            if (assignedTo === 'unassigned') {
                const sequelize = await context.app.get('sequelizeClient')
                // find the list of job id that have consultant
                const unassignedJob = await sequelize.query(`
                    SELECT DISTINCT(job_id) FROM jobs_coowners
                `).then(result => {
                    return result[0].map(({ job_id }) => job_id)
                }).catch(_e => { return [] })

                // return the list of job have id not in that list to get unassigned job
                context.params.query.id = {
                    [Op.notIn]: unassignedJob
                }
            } else {
                const rmsUser = await context.app.service('rms-users-info').get(assignedTo, {
                    query: {
                        $select: ['id', 'userId']
                    }
                }).catch(_err => {
                    throw new BadRequest('USER_NOT_EXISTED')
                })

                const jobCoOwner = await context.app.service('jobs/coowners').find({
                    query: {
                        consultantId: rmsUser.userId
                    },
                    paginate: false
                }).then(result => {
                    return result.length > 0 ? result.map(({ jobId }) => jobId) : []
                })

                context.params.query.id = {
                    $in: jobCoOwner
                }
            }



        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const jobFilterFlag = (options = {}) =>  {
    return async context => {
        if(context.params.query.flag) {
            const { flag } = context.params.query
            delete context.params.query.flag

            const sequelize = await context.app.get('sequelizeClient')
            let filterJobId = []

            // find red flag
            const jobRedFlag = await sequelize.query(`
                SELECT jobs.id FROM jobs_resume
                JOIN jobs ON jobs.id = jobs_resume.job_id
                WHERE
                    jobs."companyId" = '${context.params.query.companyId}'
                    AND jobs_resume.status IN (${CONSTANT.FLAG_STATUS.RED.join(',')})
            `).then(result => {
                return result[0].length > 0 ? result[0].map(({id}) => id) : []
            }).catch(_e => { return [] })

            // find blue flag
            const jobBlueFlag = await sequelize.query(`
                SELECT jobs.id FROM jobs_resume
                JOIN jobs ON jobs.id = jobs_resume.job_id
                WHERE
                    jobs."companyId" = '${context.params.query.companyId}'
                    AND jobs_resume.status IN (${CONSTANT.FLAG_STATUS.BLUE.join(',')})
                    AND jobs.id NOT IN (${jobRedFlag.join(',')})
            `).then(result => {
                return result[0].length > 0 ? result[0].map(({id}) => id) : []
            }).catch(_e => { return [] })

            // find grey flag
            const jobGreyFlag = await sequelize.query(`
                    SELECT jobs.id FROM jobs_resume
                    JOIN jobs ON jobs.id = jobs_resume.job_id
                    WHERE
                        jobs."companyId" = '${context.params.query.companyId}'
                        AND jobs_resume.status IN (${CONSTANT.FLAG_STATUS.GREY.join(',')})
                        AND jobs.id NOT IN (${jobRedFlag.join(',')})
                        AND jobs.id NOT IN (${jobBlueFlag.join(',')})
            `).then(result => {
                return result[0].length > 0 ? result[0].map(({id}) => id) : []
            }).catch(_e => { return [] })

            if(flag === 'red') {
                filterJobId = jobRedFlag
            }

            if(flag === 'blue') {
                filterJobId = jobBlueFlag
            }

            if(flag === 'grey') {
                filterJobId = jobGreyFlag
            }

            if(context.params.query.id)
                filterJobId.push(parseInt(context.params.query.id, 10))

            context.params.query.id = {
                $in: filterJobId
            }
        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const findJobsBeforePatch = (options = {}) => {
    return async context => {
        context.params[context.path] = await context.app.service(context.path).get(context.id).catch(_err => {
            throw new BadRequest('JOB_NOT_EXISTED')
        })

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const jobsValidateByCompany = (options = {}) => {
    return async context => {
        if (context.params.authentication?.accessToken) {
            const decodeToken = JwtDecode(context.params.authentication.accessToken)
            const rmsUser = await context.app.service('rms-users-info').findOne({
                query: {
                    userId: decodeToken.userId,
                    $select: ['id', 'companyId']
                }
            }).catch(_e => { return null })


            if (rmsUser?.companyId)
                context.params.query.companyId = rmsUser.companyId

        }
        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const checkJobsLaterView = (options = {}) => {
    return async context => {
        const jobsLaterView = await context.app.service('jobs-later-views').findOne({
            query: {
                userId: context.data.userId,
                jobId: context.data.jobId
            }
        }).catch(_e => { return null })

        if (jobsLaterView) throw new BadRequest('JOBS_LATER_VIEW_EXISTED')
        return context
    }
}
