// Initializes the `resume-documents` service on path `/resume/documents`
import createService from 'feathers-sequelize'
import createModel from '../../../models/resume/resume-documents.model'
import hooks from './resume-documents.hooks'

import fs from 'fs'
import md5 from 'md5'
import _ from 'lodash'
import multer from 'multer'
import { BadRequest, NotAuthenticated, GeneralError } from '@feathersjs/errors'

import CONSTANT from '../../../constant'
import { s3Crms as s3 } from '../../../utils'
import JwtDecode from 'jwt-decode'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['remove']
    }

    // Initialize our service with any options it requires
    app.use('/resume/documents', createService(options))

    app.post('/resume/documents/upload/:resumeId', multer({}).array('files'), async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.headers.authorization)
        } catch (_e) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(_e => {
            return res.status(500).send(new BadRequest('USER_NOT_EXISTED'))
        })

        if (_.intersection(rmsUser.user.role, CONSTANT.VALIDATE_ROLE_CRMS).length === 0) {
            return res.status(400).send(new BadRequest('USER_NOT_ALLOWED'))
        }

        const resume = await app.service('resume').get(req.params.resumeId, {
            query: {
                $select: ['id', 'firstName', 'lastName', 'companyId']
            }
        }).catch(_e => { return res.status(400).send(new BadRequest('RESUME_NOT_EXISTED')) })

        if (!req.files) return res.status(400).send(new BadRequest('FILE_NOT_EXISTED'))

        const result = []
        req.files.map(async (file) => {
            s3.createBucket(() => {
                const companyUrl = rmsUser.company?.companyUrl
                const filePath = `${resume.firstName} ${resume.lastName}-${md5(Date.now())}.${file.originalname.split('.').pop()}`
                s3.upload({
                    Bucket: CONSTANT.CRMS_BUCKET,
                    Key: `${companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}other/${filePath}`,
                    Body: file.buffer
                }, async (_err, _data) => {
                    await app.service('resume/documents').create({
                        resumeId: resume.id,
                        docPath: filePath,
                        docOriginalName: file.originalname
                    }).then(r => {
                        result.push(r)

                        if (result.length === req.files.length)
                            return res.status(200).send(result)
                        return r
                    }).catch(_e => { return true })
                })
            })
        })
        return res.status(200).send({ state: true, msg: 'UPLOADED_SUCCESSFUL' })
    })

    app.get('/resume/documents/download/:resumeDocumentId', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.headers.authorization)
        } catch (_e) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(_e => {
            return res.status(500).send(new BadRequest('USER_NOT_EXISTED'))
        })

        if (_.intersection(rmsUser.user.role, CONSTANT.VALIDATE_ROLE_CRMS).length === 0) {
            return res.status(400).send(new BadRequest('USER_NOT_ALLOWED'))
        }

        const resumeDocument = await app.service('resume/documents').get(req.params.resumeDocumentId).catch(_e => { return res.status(400).send(new BadRequest('RESUME_DOCUMENTS_NOT_EXISTED')) })

        const companyUrl = rmsUser.company?.companyUrl
        s3.getObject({
            Bucket: CONSTANT.CRMS_BUCKET,
            Key: `${companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}other/${resumeDocument.docPath}`
        }, (err, data) => {
            if (err) return res.status(500).send(new GeneralError('FILE_NOT_EXISTED'))
            try {
                fs.writeFileSync(resumeDocument.docOriginalName, data.Body)
                res.download(resumeDocument.docOriginalName, () => {
                    fs.unlinkSync(resumeDocument.docOriginalName)
                })
            } catch (_e) {
                return true
            }
        })
    })

    app.delete('/resume/documents/remove/:resumeDocumentId', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.headers.authorization)
        } catch (_e) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(_e => {
            return res.status(500).send(new BadRequest('USER_NOT_EXISTED'))
        })

        const resumeDocument = await app.service('resume/documents').get(req.params.resumeDocumentId).catch(_e => { return res.status(400).send(new BadRequest('RESUME_DOCUMENTS_NOT_EXISTED')) })

        const companyUrl = rmsUser.company?.companyUrl
        s3.deleteObject({
            Bucket: CONSTANT.CRMS_BUCKET,
            Key: `${companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}other/${resumeDocument.docPath}`,
        }, (_err, _data) => {
            app.service('resume/documents').remove(resumeDocument.id)
            return res.status(200).send({ state: true, msg: 'REMOVE_SUCCESSFUL' })
        })

    })

    // Get our initialized service so that we can register hooks
    const service = app.service('resume/documents')

    service.hooks(hooks)
}
