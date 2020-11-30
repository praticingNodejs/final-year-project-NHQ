// Initializes the `jobs-resume-documents` service on path `/jobs/resume/documents`
import createService from 'feathers-sequelize'
import createModel from '../../../../models/jobs/jobs-resume/jobs-resume-documents.model'
import hooks from './jobs-resume-documents.hooks'

import { NotAuthenticated, GeneralError, BadRequest } from '@feathersjs/errors'
import JwtDecode from 'jwt-decode'
import fs from 'fs'
import multer from 'multer'
import md5 from 'md5'

import CONSTANT from '../../../../constant'
import { s3Crms as s3 } from '../../../../utils'


export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    app.post('/jobs/resume/upload-documents/:jobsResumeId', multer({}).array('files'), async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const jobResume = await app.service('jobs/resume').get(req.params.jobsResumeId).catch(_err => { return res.status(400).send(new BadRequest('JOB_RESUME_NOT_EXISTED')) })

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })

        let { company } = rmsUser
        if (!company) res.status(400).send(new BadRequest('USER_NOT_ALLOWED'))

        let result = []
        for (let file of req.files) {
            s3.createBucket(() => {
                const docPath = `${file.originalname.split('.')[0]}_${md5(Date.now())}.${file.originalname.split('.').pop()}`
                s3.upload({
                    client: s3,
                    Bucket: CONSTANT.CRMS_BUCKET,
                    Key: `${company.companyUrl}/jobresumerelation/${docPath}`,
                    Body: file.buffer
                }, async (_err, _data) => {
                    await app.service('jobs/resume/documents').create({
                        jobsResumeId: jobResume.id,
                        documentPath: docPath,
                        documentOriginalName: file.originalname
                    }).then(r => {
                        let returnObject = {
                            id: r.id,
                            jobsResumeId: r.jobsResumeId,
                            documentPath: r.documentPath,
                            documentOriginalName: file.originalname
                        }
                        result.push(returnObject)

                        if (result.length === req.files.length)
                            res.status(200).send(JSON.stringify({ state: true, result }))
                    }).catch(_err => {
                        return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                    })
                })
            })
        }
    })

    app.delete('/jobs/resume/upload-documents/:jobResumeDocumentId', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const jobResumeDocument = await app.service('jobs/resume/documents').get(req.params.jobResumeDocumentId).catch(_err => { return res.status(400).send(new BadRequest('JOB_RESUME_DOCUMENT_NOT_EXISTED')) })

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(_err => { return res.status(500).send(new GeneralError('USER_NOT_EXISTED')) })

        if (jobResumeDocument?.jobsResume) {
            let { company } = rmsUser
            !company ? res.status(500).send(new GeneralError('USER_NOT_ALLOWED')) :
                s3.deleteObject({
                    Bucket: CONSTANT.BUCKET,
                    Key: `${company.companyUrl}/jobresumerelation/${jobResumeDocument.documentPath}`
                }, async (err, _data) => {
                    if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))

                    await app.service('jobs/resume/documents').remove(jobResumeDocument.id)
                    res.status(200).send({ state: true })
                })
        } else {
            return res.status(500).send(new GeneralError('JOB_RESUME_NOT_EXISTED'))
        }
    })

    app.get('/jobs/resume/download-documents/:jobResumeDocumentId', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const jobResumeDocument = await app.service('jobs/resume/documents').get(req.params.jobResumeDocumentId).catch(_e => { return null })

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(_err => { return res.status(500).send(new GeneralError('USER_NOT_EXISTED')) })

        if (jobResumeDocument?.jobsResume) {
            let { company } = rmsUser
            if (!company)
                res.status(500).send(new GeneralError('USER_NOT_ALLOWED'))
            s3.getObject({
                Bucket: CONSTANT.CRMS_BUCKET,
                Key: `${company.companyUrl}/jobresumerelation/${jobResumeDocument.documentPath}`
            }, async (err, data) => {
                if (err) return res.status(500).send(new GeneralError('FILE_NOT_EXISTED'))
                try {
                    fs.writeFileSync(jobResumeDocument.documentOriginalName, data.Body)
                    res.download(jobResumeDocument.documentOriginalName, () => {
                        fs.unlinkSync(jobResumeDocument.documentOriginalName)
                    })
                } catch (_e) {
                    return true
                }
            })
        } else {
            return res.status(500).send(new GeneralError('JOB_RESUME_OT_EXISTED'))
        }
    })

    // Initialize our service with any options it requires
    app.use('/jobs/resume/documents', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('jobs/resume/documents')

    service.hooks(hooks)
}
