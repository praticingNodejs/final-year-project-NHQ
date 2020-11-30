// Initializes the `jobs` service on path `/jobs`
import createService from 'feathers-sequelize'
import createModel from '../../models/jobs/jobs.model'
import hooks from './jobs.hooks'

import { GeneralError, NotAuthenticated, BadRequest } from '@feathersjs/errors'
import JwtDecode from 'jwt-decode'

import CONSTANT from '../../constant'
import { filterSpecialCharacters } from '../../utils'
import { body, validationResult } from 'express-validator'


export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['create', 'update', 'patch', 'remove']
    }

    function regexFTS(text) {
        text = filterSpecialCharacters(text.trim())
            .trim()
            .toLowerCase()
            .replace(CONSTANT.REGEX_SPACING, CONSTANT.REPLACING_FTS_SPACING)

        if (text === 'it')
            text = text.replace(CONSTANT.REGEX_IT, CONSTANT.REPLACING_FTS_IT)

        return text
    }

    function getQueryFTS(text) {
        return `("fullTextSearch" @@ ${CONSTANT.TEXT_TS_QUERY}('simple', '${text}:*'))`
    }

    app.get('/jobs/search', async (req, res) => {
        let decodeToken = null
        if (req.feathers.headers.authorization) {
            try {
                decodeToken = req.feathers.authentication.accessToken ? JwtDecode(req.feathers.authentication.accessToken) : null
            } catch (err) {
                return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
            }
        }

        const sequelize = app.get('sequelizeClient')
        const limit = req.query.$limit ? req.query.$limit : 10
        const skip = req.query.$skip ? req.query.$skip : 0

        let query = CONSTANT.QUERY_WHERE, condition = ''

        if (req.query.s) {
            let searchString = ''
            const arrayFts = []
            if (Array.isArray(req.query.s))
                await req.query.s.map(e => {
                    searchString = regexFTS(e)
                    let query = getQueryFTS(searchString)
                    arrayFts.push(query)
                })
            else searchString = regexFTS(req.query.s)

            app.service('trending-keywords/add').create({ text: searchString }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) }) // add trending keyword, no need for await here
            query += Array.isArray(req.query.s) ? condition + `(${arrayFts.join(CONSTANT.QUERY_OR)})` : condition + getQueryFTS(searchString)
            condition = CONSTANT.QUERY_AND
        }

        if (req.query.sectorId && Array.isArray(req.query.sectorId)) {
            query += condition + `"sectorId" IN (${req.query.sectorId})`
            condition = CONSTANT.QUERY_AND
        }

        if (req.query.position) {
            query += condition + `"position" iLike '%${req.query.position}%'`
            condition = CONSTANT.QUERY_AND
        }

        if (req.query.id) {
            if(req.query.id.$ne)
                query += condition + `id != ${req.query.id.$ne}`
            else
                query += condition + `id = ${req.query.id}`
            condition = CONSTANT.QUERY_AND
        }

        if (req.query.companyId) {
            query += Array.isArray(req.query.companyId) ? condition + `"companyId" IN (${req.query.companyId})` : condition + `"companyId" = ${req.query.companyId}`
            condition = CONSTANT.QUERY_AND
        }

        if (req.query.flag) {
            query += condition + `flag = ${req.query.flag}`
            condition = CONSTANT.QUERY_AND
        }

        // if (req.query.statusId) {
        //     query += condition + `"statusId" = ${req.query.statusId}`
        //     condition = CONSTANT.QUERY_AND
        // }

        if (req.query.projectId) {
            if (Array.isArray(req.query.projectId?.$in)) {
                query += condition + `"projectId" IN (${req.query.projectId.$in.join(',')})`
            } else {
                const projectId = req.query.projectId.$in || req.query.projectId
                query += condition + `"projectId" = ${projectId}`
            }
            condition = CONSTANT.QUERY_AND
        }

        query += condition + `
            "showInPortal" = true
            AND "isActive" = 1
            AND "statusId" = 239 -- open job
            AND "companyId" NOT IN (
                SELECT id FROM companies WHERE status = 0
            )
        `

        let order = CONSTANT.QUERY_ORDER, field = []
        if (req.query.$sort) {
            let sort = req.query.$sort
            if (sort.id)
                field.push(`id ${sort.id === '-1' ? CONSTANT.ORDER_DESC : CONSTANT.ORDER_ASC}`)
            if (sort.portalDate)
                field.push(`"portalDate" ${sort.portalDate === '-1' ? CONSTANT.ORDER_DESC : CONSTANT.ORDER_ASC}`)
            if (sort.maxSalary)
                field.push(`"maxSalary" ${sort.maxSalary === '-1' ? CONSTANT.ORDER_DESC : CONSTANT.ORDER_ASC}`)

            order = order + field.join(',')
        }

        order = order === CONSTANT.QUERY_ORDER ? CONSTANT.QUERY_ORDER + 'id' + CONSTANT.ORDER_ASC : order

        const total = (await sequelize.query(`SELECT COUNT(id) FROM jobs ${query};`).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) }))[0][0]
        sequelize.query(`SELECT * FROM jobs ${query} ${order} LIMIT ${limit} OFFSET ${skip};`).then(async searchResult => {
            let data = []
            const populatedJob = searchResult[0].map(async job => {
                job.workCountryLocation = job.workCountry ? await app.service('locations').get(job.workCountry, {
                    query: {
                        $select: ['id', 'name', 'abbreviation']
                    }
                }).catch(_e => { return null }) : null

                job.sector = job.sectorId ? await app.service('sectors').get(job.sectorId, {
                    query: {
                        $select: ['id', 'name']
                    }
                }).catch(_e => { return null }) : null

                job.salaryCurrencyObj = job.salaryCurrency ? await app.service('currencies').get(job.salaryCurrency, {
                    query: { $select: ['id', 'name'] }
                }).catch(_e => { return null }) : null

                job.company = job.companyId ? await app.service('companies').get(job.companyId, {
                    query: {
                        $select: ['id', 'name', 'imagePath', 'companyUrl', 'website', 'weekWorkHours', 'country', 'description']
                    }
                }).catch(_e => { return null }) : null

                job.project = job.projectId ? await app.service('projects').get(job.projectId, {
                    query: {
                        $select: ['id', 'name']
                    },
                }).catch(_e => { return null }) : null

                job.status = job.statusId ? await app.service('job-statuses').get(job.statusId, {
                    query: {
                        $select: ['id', 'name']
                    }
                }).catch(_e => { return null }) : null

                job.contactPerson = job.contactPersonId ? await app.service('projects/contacts').get(job.contactPersonId).catch(_e => { return null }) : null

                job.coowners = await app.service('jobs/coowners').find({
                    query: {
                        jobId: job.id,
                        $select: ['id', 'consultantId']
                    },
                    paginate: false
                }).catch(_e => { return null })

                job.education = job.educationId ? await app.service('educations').get(job.educationId, {
                    query: {
                        $select: ['id', 'name']
                    }
                }).catch(_e => { return null }) : null


                job.jobResume = await sequelize.query(`
                    SELECT id
                        ,submitted_on as "submittedOn"
                        ,resume_id as "resumeId"
                    FROM jobs_resume AS jr
                    WHERE
                        jr.job_id = ${job.id}
                    ORDER BY jr.submitted_on DESC
                `).then(result => {
                    return result[0]
                }).catch(_e => {
                    return null
                })

                job.lastSubmitted = job.jobResume.length > 0 ? new Date(job.jobResume[job.jobResume.length - 1].submittedOn).getTime() : null

                job.jobProjectContact = await app.service('jobs/project-contacts').find({
                    query: {
                        jobId: job.id
                    },
                    paginate: false
                }).catch(_e => { return null })

                let tmp = decodeToken ? await app.service('jobs-later-views').findOne({
                    query: {
                        userId: decodeToken.userId,
                        jobId: job.id,
                        $select: ['id']
                    },
                    paginate: false
                }).catch(_e => { return null }) : null

                job.laterView = tmp ? tmp : null
                job.isLaterView = tmp ? true : false

                delete job.fullTextSearch

                data.push(job)
            })

            await Promise.all(populatedJob)

            res.status(200).send({
                total: parseInt(total.count, 10),
                limit: parseInt(limit, 10),
                skip: parseInt(skip, 10),
                data: data.sort()
            })
        }).catch(_err => {
            return res.status(500).send(new GeneralError('ERR_CONNECTION'))
        })
    })

    app.post('/jobs/check-duplicate', [
        body('projectId').isInt().withMessage('PROJECT_IS_REQUIRED')
    ], async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        const errors = await validationResult(req).errors

        if (errors.length > 0)
            return res.status(400).send(new BadRequest(errors[0].msg))

        const condition = {
            projectId: req.body.projectId
        }

        if ('sectorId' in req.body) condition.sectorId = req.body.sectorId
        if ('disciplineId' in req.body) condition.disciplineId = req.body.disciplineId
        if ('rankId' in req.body) condition.rankId = req.body.rankId
        if ('roleId' in req.body) condition.roleId = req.body.roleId // designations

        const job = await app.service('jobs').find({
            query: condition,
            paginate: false
        }).catch(_e => { return [] })

        return job.length > 0 ? res.status(200).send({ state: true, code: 200, message: 'JOB_EXISTED', job })
            : res.status(200).send({ state: false, code: 200, message: 'JOB_NOT_EXISTED' })
    })

    // Initialize our service with any options it requires
    app.use('/jobs', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs')

    service.hooks(hooks)
}
