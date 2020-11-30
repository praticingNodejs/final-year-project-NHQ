// Initializes the `projects` service on path `/projects`
import createService from 'feathers-sequelize'
import createModel from '../../models/projects/projects.model'
import hooks from './projects.hooks'

import JwtDecode from 'jwt-decode'
import { NotAuthenticated, BadRequest, GeneralError } from '@feathersjs/errors'

import CONSTANT from '../../constant'
import { filterSpecialCharacters } from '../../utils'
import { body, validationResult } from 'express-validator'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    app.post('/projects/resume-submission', [
        body('projectId').isInt().withMessage('PROJECT_IS_REQUIRED')
    ], async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        const errors = await validationResult(req).errors
        if (errors.length > 0)
            return res.status(400).send(new BadRequest(errors[0].msg))

        let decodeToken
        if (req.feathers.headers.authorization) {
            try {
                decodeToken = JwtDecode(req.feathers.authentication.accessToken)
            } catch (err) {
                return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
            }
        }

        await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id']
            }
        }).catch(_e => { return 'INVALID_TOKEN' })

        let query = CONSTANT.QUERY_WHERE, condition = ''

        let queryAdditionalField = ''

        //---------------------Validate pattern-------------------------------
        if (req.body.projectId) {
            query += condition + `j."projectId" = ${req.body.projectId}`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.jobStatusId && Array.isArray(req.body.jobStatusId) && req.body.jobStatusId.length > 0) {
            query += condition + `j."statusId" IN (${req.body.jobStatusId.join(',')})`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.jobId) {
            query += condition + `j.id = ${filterSpecialCharacters(req.body.jobId)}`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.assignedTo && Array.isArray(req.body.assignedTo) && req.body.assignedTo.length > 0) {
            query += condition + `j.id IN (
                SELECT job_id from jobs_coowners WHERE jobs_coowners.consultant_id IN ('${req.body.assignedTo.join('\',\'')}')
            )`
        }

        if (req.body.jobsResumeStatus && Array.isArray(req.body.jobsResumeStatus) && req.body.jobsResumeStatus.length > 0) {
            query += condition + `jr.status IN (${req.body.jobsResumeStatus.join(',')})`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.submittedBy && Array.isArray(req.body.submittedBy) && req.body.submittedBy.length > 0) {
            query += condition + `jr.consultant_id IN ('${req.body.submittedBy.join(',')}')`
            condition = CONSTANT.QUERY_AND
        }

        // if (req.body.gender) {
        //     query += condition + `r.gender = '${filterSpecialCharacters(req.body.gender)}'`
        //     condition = CONSTANT.QUERY_AND
        // }

        // if (req.body.dob) {
        //     query += condition + `r.dob = '${req.body.dob}'`
        //     condition = CONSTANT.QUERY_AND
        // }

        if (req.body.jobsResumeSubmittedFrom) {
            query += condition + `jr.submitted_on >= '${req.body.jobsResumeSubmittedFrom}'`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.jobsResumeSubmittedTo) {
            query += condition + `jr.submitted_on <= '${req.body.jobsResumeSubmittedTo}'`
            condition = CONSTANT.QUERY_AND
        }
        //---------------------------------------------------------------------

        //-----------------------Additional Field------------------------------
        const additionalField = {
            availability: req.body.availability,
            nationality: req.body.nationality,
            currentLocation: req.body.currentLocation,
            empStatus: req.body.empStatus,
            reasonLeaving: req.body.reasonLeaving,
            sgpResidentialStatus: req.body.sgpResidentialStatus,
            currentSalary: req.body.currentSalary,
            expSalary: req.body.expSalary,
            qualification: req.body.qualification,
            otherBenefits: req.body.otherBenefits,
            expOtherBenefits: req.body.expOtherBenefits,
            otherRates: req.body.otherRates,
            workExpTotal: req.body.workExpTotal,
            workExpRelevant: req.body.workExpRelevant,
            gender: req.body.gender,
            dob: req.body.dob
        }

        if (additionalField.availability)
            queryAdditionalField += ',  r.availability'

        if (additionalField.nationality)
            queryAdditionalField += ', (SELECT name FROM nationalities WHERE id = r.nationality_id) as "nationality"'

        if (additionalField.currentLocation)
            queryAdditionalField += ', (SELECT name FROM locations WHERE id = r.current_location_id) as "currentLocation"'

        if (additionalField.empStatus)
            queryAdditionalField += ', r.emp_status AS "empStatus"'

        if (additionalField.reasonLeaving)
            queryAdditionalField += ', r.reason_leaving AS "reasonLeaving"'

        if (additionalField.sgpResidentialStatus)
            queryAdditionalField += ', (SELECT name FROM sgp_residential_status WHERE id = r.sgp_residential_status) AS "sgpResidentialStatus"'

        if (additionalField.currentSalary)
            queryAdditionalField += ', (SELECT CONCAT(r.salary_amount, \' \', (SELECT name FROM currencies WHERE id = r.salary_currency))) AS "currentSalary"'

        if (additionalField.expSalary)
            queryAdditionalField += ', (SELECT CONCAT(r.exp_salary_amount, \' \', (SELECT name FROM currencies WHERE id = r.exp_salary_currency))) AS "expSalary"'

        if (additionalField.qualification)
            queryAdditionalField += ', (SELECT name FROM educations WHERE id = r.education_id) AS "qualification"'

        if (additionalField.otherBenefits)
            queryAdditionalField += ', r.other_benefits AS "otherBenefits"'

        if (additionalField.expOtherBenefits)
            queryAdditionalField += ', r.exp_other_benefits AS "expOtherBenefits"'

        if (additionalField.otherRates)
            queryAdditionalField += ', r.other_remarks AS "otherRates"'

        if (additionalField.workExpTotal)
            queryAdditionalField += ', r.work_exp_total AS "workExpTotal"'

        if (additionalField.workExpRelevant)
            queryAdditionalField += ', r.work_exp_relevant as "workExpRelevant"'

        // if (additionalField.gender) {
        queryAdditionalField += ', r.gender'
        // }

        if (additionalField.dob) {
            queryAdditionalField += ', r.dob'
        }
        //---------------------------------------------------------------------
        const sequelize = await app.get('sequelizeClient')
        const jobsResume = await sequelize.query(`
            SELECT
                jr.id, jr.consultant_id AS "consultantId", job_id AS "jobId", resume_id AS "resumeId", j.position, jr.status, r.first_name AS "firstName", r.last_name AS "lastName", jr.submitted_on AS "submittedOn",
                (SELECT remark FROM jobs_resume_remarks WHERE jobs_resume_id = jr.id ORDER BY id DESC LIMIT 1) as remark,
                (SELECT created_at FROM jobs_resume_remarks WHERE jobs_resume_id = jr.id ORDER BY id DESC LIMIT 1) as "remarkAt"
                ${queryAdditionalField}
            FROM jobs_resume AS jr
            INNER JOIN jobs AS j ON j.id = jr.job_id
            INNER JOIN resume AS r ON r.id = jr.resume_id
            ${query}
            AND jr.consultant_id IS NOT NULL
        `).then(result => {
            return result[0]
        }).catch(_err => {
            return res.status(500).send(new GeneralError('ERR_CONNECTION'))
        })

        if (jobsResume.length > 0) {
            const mapJobsResume = await jobsResume.map(async obj => {
                obj.consultant = obj.consultantId ? await app.service('rms-users-info').findOne({
                    query: {
                        userId: obj.consultantId,
                        $select: ['firstName', 'lastName']
                    }
                }).then(result => {
                    return `${result.firstName || ''} ${result.lastName || ''}`
                }).catch(_err => { return null }) : null

                obj.assignedTo = await app.service('jobs/coowners').find({
                    query: {
                        jobId: obj.jobId,
                        $select: ['consultantId']
                    },
                    paginate: false
                }).then(result => {
                    return result.map(({ consultant }) => {
                        return `${consultant.firstName || ''} ${consultant.lastName || ''}`
                    })
                }).catch(_e => { return [] })
            })

            await Promise.all(mapJobsResume)

            return res.status(200).send({
                total: jobsResume.length,
                additionalField,
                data: jobsResume
            })
        }

        return res.status(200).send({
            total: 0,
            additionalField,
            data: []
        })
    })

    // Initialize our service with any options it requires
    app.use('/projects', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('projects')

    service.hooks(hooks)
}
