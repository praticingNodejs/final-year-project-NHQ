/* eslint-disable indent */
// Initializes the `rms-users-info` service on path `/rms-users-info`

import createService from 'feathers-sequelize'
import createModel from '../../../models/users/rms-users-info.model'
import hooks from './rms-users-info.hooks'

import { NotAuthenticated } from '@feathersjs/errors'
import JwtDecode from 'jwt-decode'
import _ from 'lodash'
import moment from 'moment-timezone'

import { dynamicSort, dynamicSortMultilevel } from '../../../utils'
import CONSTANT from '../../../constant'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    app.get('/reports', async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['companyId']
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })
        if (!rmsUser) return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED'))

        const limit = parseInt(req.query.$limit, 10) || 10
        const skip = parseInt(req.query.$skip, 10) || 0

        let listRmsUser = await app.service('rms-users-info').find({
            query: {
                companyId: rmsUser.companyId,
                $select: ['id', 'userId', 'firstName', 'lastName'],
                status: 1,
                $sort: {
                    id: 1
                }
            },
            paginate: false
        }).catch(_e => { return [] })

        const sequelize = await app.get('sequelizeClient')
        if (listRmsUser.length > 0) {
            const result = []
            for (let user of listRmsUser) {
                const totalAssigned = await sequelize.query(`
                    SELECT COUNT(*) FROM jobs_coowners AS jc
                    JOIN jobs ON jc.job_id = jobs.id
                    WHERE jc.consultant_id = '${user.userId}'
                    AND jobs."statusId" = 239
                `).then(result => {
                    return parseInt(result[0][0].count, 10)
                }).catch(_e => { return 0 })

                const resumeOpen = await sequelize.query(`
                    SELECT COUNT(*) FROM jobs_resume AS jr
                    JOIN jobs ON jr.job_id = jobs.id
                    WHERE jr.consultant_id = '${user.userId}'
                    AND jobs."statusId" = 239
                    ${req.query.fromDate ? `AND jr.submitted_on > '${req.query.fromDate}'` : ''}
                    ${req.query.toDate ? `AND jr.submitted_on < '${req.query.toDate}'` : ''}
                `).then(result => {
                    return parseInt(result[0][0].count, 10)
                }).catch(_e => { return 0 })

                const resumeOther = await sequelize.query(`
                    SELECT COUNT(*) FROM jobs_resume AS jr
                    JOIN jobs ON jr.job_id = jobs.id
                    WHERE jr.consultant_id = '${user.userId}'
                    AND jobs."statusId" != 239
                    ${req.query.fromDate ? `AND jr.submitted_on > '${req.query.fromDate}'` : ''}
                    ${req.query.toDate ? `AND jr.submitted_on < '${req.query.toDate}'` : ''}
                `).then(result => {
                    return parseInt(result[0][0].count, 10)
                }).catch(_e => { return 0 })

                // jr.status = 2 ==> commenced
                const resumeSuccessful = await sequelize.query(`
                    SELECT COUNT(*) FROM jobs_resume AS jr
                    JOIN jobs ON jr.job_id = jobs.id
                    WHERE jr.consultant_id = '${user.userId}'
                    AND jr.status = 2
                    AND jobs."statusId" = 239
                    ${req.query.fromDate ? `AND jr.submitted_on > '${req.query.fromDate}'` : ''}
                    ${req.query.toDate ? `AND jr.submitted_on < '${req.query.toDate}'` : ''}
                `).then(result => {
                    return parseInt(result[0][0].count, 10)
                }).catch(_e => { return 0 })

                const resumeInterviewed = await sequelize.query(`
                    SELECT COUNT(*) FROM jobs_resume AS jr
                    JOIN jobs ON jr.job_id = jobs.id
                    WHERE jr.consultant_id = '${user.userId}'
                    AND (
                        jr.status = 2 OR jr.status = 4 OR jr.status = 5 OR jr.status = 6 OR jr.status = 7 OR jr.status = 8 OR jr.status = 9
                    )
                    AND jobs."statusId" = 239
                    ${req.query.fromDate ? `AND jr.submitted_on > '${req.query.fromDate}'` : ''}
                    ${req.query.toDate ? `AND jr.submitted_on < '${req.query.toDate}'` : ''}
                `).then(result => {
                    return parseInt(result[0][0].count, 10)
                }).catch(_e => { return 0 })

                result.push({
                    recruiter: {
                        userId: user.userId,
                        name: `${user.firstName || ''} ${user.lastName || ''}`,
                    },
                    totalAssigned,
                    resumeOpen,
                    resumeOther,
                    resumeSuccessful,
                    resumeInterviewed
                })
            }

            let data = result
            // sort recruiter
            if (req.query.$sort?.recruiter === '1') {
                data = result.sort(dynamicSortMultilevel('recruiter.name'))
            }
            if (req.query.$sort?.recruiter === '-1') {
                data = result.sort(dynamicSortMultilevel('-recruiter.name'))
            }

            // sort job assigned
            if (req.query.$sort?.jobAssigned === '1') {
                data = result.sort(dynamicSort('totalAssigned'))
            }
            if (req.query.$sort?.jobAssigned === '-1') {
                data = result.sort(dynamicSort('-totalAssigned'))
            }

            // sort resume open
            if (req.query.$sort?.resumeSubmittedOpen === '1') {
                data = result.sort(dynamicSort('resumeOpen'))
            }
            if (req.query.$sort?.resumeSubmittedOpen === '-1') {
                data = result.sort(dynamicSort('-resumeOpen'))
            }

            // sort resume other
            if (req.query.$sort?.resumeSubmittedOthers === '1') {
                data = result.sort(dynamicSort('resumeOther'))
            }
            if (req.query.$sort?.resumeSubmittedOthers === '-1') {
                data = result.sort(dynamicSort('-resumeOther'))
            }

            // sort resume successful
            if (req.query.$sort?.successfulResume === '1') {
                data = result.sort(dynamicSort('resumeSuccessful'))
            }
            if (req.query.$sort?.successfulResume === '-1') {
                data = result.sort(dynamicSort('-resumeSuccessful'))
            }

            // sort resume interviewed
            if (req.query.$sort?.resumeInterviewed === '1') {
                data = result.sort(dynamicSort('resumeInterviewed'))
            }
            if (req.query.$sort?.resumeInterviewed === '-1') {
                data = result.sort(dynamicSort('-resumeInterviewed'))
            }

            data = data.slice(skip, skip + limit)
            return res.status(200).send({
                total: listRmsUser.length,
                limit: limit,
                skip: skip,
                data
            })
        } else {
            return res.status(200).send({
                total: 0,
                limit: limit,
                skip: skip,
                data: []
            })
        }
    })

    app.post('/reports/user-stats', async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['userId']
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })
        if (!rmsUser) return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED'))
        if(_.intersection(rmsUser.user.role, CONSTANT.VALIDATE_ROLE_ARMS).length === 0)
            return res.status(400).send(new NotAuthenticated('USER_NOT_ALLOWED'))

        const result = { }
        const sequelize = await app.get('sequelizeClient')
        const newDate = new Date()

        const query = {
            static: {
                user: `
                    SELECT COUNT(*) FROM users
                    WHERE
                        id NOT IN (
                            SELECT user_id FROM rms_users_info
                        )
                        AND is_verified = true
                        AND is_active = 1
                        AND id IN (
                            SELECT DISTINCT(user_id) FROM resume
                            WHERE
                                resume.is_active = 1
                                ${req.body.nationality ? `AND resume.nationality_id = '${req.body.nationality}'` : ''}
                                ${req.body.currentLocationId ? `AND resume.current_location_id = '${req.body.currentLocationId}'` : ''}
                                ${req.body.sgpResidentialStatus ? `AND resume.sgp_residential_status = '${req.body.sgpResidentialStatus}'`: '' }
                                ${req.body.age && Array.isArray(req.body.age) && req.body.age.length > 0 ? ' AND (' + req.body.age.map(age => { // group age query in side ()
                                    const yearNow = (newDate).getFullYear()
                                    const monthDate = moment(newDate).format('MM-DD')
                                    const minAge = CONSTANT.RESUME_SEARCH_FILTER_AGE[age - 1].min
                                    const maxAge = CONSTANT.RESUME_SEARCH_FILTER_AGE[age - 1].max
                                    if (!isNaN(age) && age <= CONSTANT.RESUME_SEARCH_FILTER_AGE.length && age > 0) {
                                        // get query age correspond to each range
                                        let filter = age === CONSTANT.RESUME_SEARCH_FILTER_AGE.length ?
                                            `(dob < '${yearNow - minAge}-${monthDate}')` : `(dob < '${yearNow - minAge}-${monthDate}' AND dob > '${yearNow - maxAge}-${monthDate}')`

                                        return filter
                                    }
                                }).join(' OR ') + ')' : ''}
                                ${req.body.gender ? `AND resume.gender iLike '${req.body.gender}'` : ''}
                        )
                `,
                jobResume: `
                    SELECT COUNT(*) FROM jobs_resume
                    WHERE
                        is_approved = 1
                        AND resume_id IN (
                            SELECT id FROM resume
                            WHERE
                                resume.root_resume_id is null
                                ${req.body.nationality ? `AND resume.nationality_id = '${req.body.nationality}'` : ''}
                                ${req.body.currentLocationId ? `AND resume.current_location_id = '${req.body.currentLocationId}'` : ''}
                                ${req.body.sgpResidentialStatus ? `AND resume.sgp_residential_status = '${req.body.sgpResidentialStatus}'`: '' }
                                ${req.body.age && Array.isArray(req.body.age) && req.body.age.length > 0 ? ' AND (' + req.body.age.map(age => {
                                    const yearNow = (newDate).getFullYear()
                                    const monthDate = moment(newDate).format('MM-DD')
                                    const minAge = CONSTANT.RESUME_SEARCH_FILTER_AGE[age - 1].min
                                    const maxAge = CONSTANT.RESUME_SEARCH_FILTER_AGE[age - 1].max
                                    if (!isNaN(age) && age <= CONSTANT.RESUME_SEARCH_FILTER_AGE.length && age > 0) {
                                        let filter = age === CONSTANT.RESUME_SEARCH_FILTER_AGE.length ?
                                            `(dob < '${yearNow - minAge}-${monthDate}')` : `(dob < '${yearNow - minAge}-${monthDate}' AND dob > '${yearNow - maxAge}-${monthDate}')`

                                        return filter
                                    }
                                }).join(' OR ') + ')' : ''}
                                ${req.body.gender ? `AND resume.gender iLike '${req.body.gender}'` : ''}
                        )

                        ${
                            Array.isArray(req.body.rankId) && req.body.rankId.length > 0 ||
                            Array.isArray(req.body.disciplineId) && req.body.disciplineId.length > 0 ||
                            Array.isArray(req.body.designationId) && req.body.designationId.length > 0 ||
                            Array.isArray(req.body.sectorId) && req.body.sectorId.length > 0 ?
                            `AND job_id IN (
                                SELECT id FROM jobs
                                WHERE
                                    ${Array.isArray(req.body.rankId) && req.body.rankId.length > 0 ? '"rankId" IN (' + req.body.rankId.join(',') + ')' : ''}
                                    ${Array.isArray(req.body.disciplineId) && req.body.disciplineId.length > 0 ? '"disciplineId" IN (' + req.body.disciplineId.join(',') + ')' : ''}
                                    ${Array.isArray(req.body.designationId) && req.body.designationId.length > 0 ? '"designationId" IN (' + req.body.designationId.join(',') + ')' : ''}
                                    ${Array.isArray(req.body.sectorId) && req.body.sectorId.length > 0 ? '"sectorId" IN (' + req.body.sectorId.join(',') + ')' : ''}
                            )`
                        : ''}
                `
            },
            graph: {
                user: `
                SELECT COUNT(*) FROM users
                WHERE
                    id NOT IN (
                        SELECT user_id FROM rms_users_info
                    )
                    AND is_verified = true
                    AND is_active = 1
                    AND id IN (
                        SELECT DISTINCT(user_id) FROM resume WHERE resume.is_active = 1
                    )
                `,
                jobResume: `
                    SELECT COUNT(*) FROM jobs_resume
                    WHERE
                        is_approved = 1
                        AND resume_id IN (
                            SELECT id FROM resume
                            WHERE root_resume_id is null
                        )
                `
            }
        }

        let condition = CONSTANT.QUERY_AND

        // statistical
        if (req.body.fromDate) {
            query.static.user += condition + `created_at > '${req.body.fromDate}'`
            query.static.jobResume += condition + `submitted_on > '${req.body.fromDate}'`
            condition += CONSTANT.QUERY_AND
        }

        if (req.body.toDate) {
            query.static.user += condition+ `created_at < '${req.body.toDate}'`
            query.static.jobResume += condition + `submitted_on < '${req.body.toDate}'`
            condition += CONSTANT.QUERY_AND
        }

        result.statistical = {
            signUpUser: await sequelize.query(query.static.user).then(r => {
                return parseInt(r[0][0].count,10)
            }).catch(_e => { return 0 }),
            resumeApply: await sequelize.query(query.static.jobResume).then(r => {
                return parseInt(r[0][0].count, 10)
            }).catch(_e => { return 0 })
        }

        // graph
        const schedule = CONSTANT.GET_REPORT_GRAPH_SCHEDULE(req.body.schedule || '1') // return timestamp between each stage

        const getTime = (timestamp, format = 'YYYY-MM-DD') => {
            return moment(new Date(Date.now() - timestamp)).format(format)
        }

        const getDataGraphUser = (index) => {
            return new Promise((resolve, reject) => {
                const userQuery = query.graph.user + CONSTANT.QUERY_AND + `created_at > '${getTime(schedule * (index + 1))}' AND created_at <= '${getTime(schedule * index)}'`
                sequelize.query(userQuery).then(result => {
                    return parseInt(result[0][0].count, 10)
                }).then(result => {
                    return resolve(result)
                }).catch(_e => {
                    return reject(0)
                })
            })
        }

        const getDataJobApplied = (index) => {
            return new Promise((resolve, reject) => {
                const jobAppliedQuery = query.graph.jobResume + CONSTANT.QUERY_AND + `submitted_on > '${getTime(schedule * (index + 1))}' AND submitted_on <= '${getTime(schedule * index)}'`
                sequelize.query(jobAppliedQuery).then(result => {
                    return parseInt(result[0][0].count, 10)
                }).then(result => {
                    return resolve(result)
                }).catch(_e => {
                    return reject(0)
                })
            })
        }

        result.graph = [{
            id: 5,
            date: getTime(schedule * 5, 'DD-MMM-YYYY'),
            data: {
                signUpUser: await getDataGraphUser(5),
                resumeApply: await getDataJobApplied(5)
            }
        }, {
            id: 4,
            date: getTime(schedule * 4, 'DD-MMM-YYYY'),
            data: {
                signUpUser: await getDataGraphUser(4),
                resumeApply: await getDataJobApplied(4)
            }
        }, {
            id: 3,
            date: getTime(schedule * 3, 'DD-MMM-YYYY'),
            data: {
                signUpUser: await getDataGraphUser(3),
                resumeApply: await getDataJobApplied(3)
            }
        }, {
            id: 2,
            date: getTime(schedule * 2, 'DD-MMM-YYYY'),
            data: {
                signUpUser: await getDataGraphUser(2),
                resumeApply: await getDataJobApplied(2)
            }
        }, {
            id: 1,
            date: getTime(schedule * 1, 'DD-MMM-YYYY'),
            data: {
                signUpUser: await getDataGraphUser(1),
                resumeApply: await getDataJobApplied(1)
            }
        }, {
            id: 0,
            date: getTime(0, 'DD-MMM-YYYY'),
            data: {
                signUpUser: await getDataGraphUser(0),
                resumeApply: await getDataJobApplied(0)
            }
        }]

        return res.status(200).send(result)
    })

    // Initialize our service with any options it requires
    app.use('/rms-users-info', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('rms-users-info')

    service.hooks(hooks)
}
