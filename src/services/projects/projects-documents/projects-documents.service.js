// Initializes the `project-documents` service on path `/project/documents`
import createService from 'feathers-sequelize'
import createModel from '../../../models/projects/projects-documents.model'
import hooks from './projects-documents.hooks'

import { NotAuthenticated, BadRequest, GeneralError } from '@feathersjs/errors'
import multer from 'multer'
import md5 from 'md5'
import JwtDecode from 'jwt-decode'
import fs from 'fs'
import _ from 'lodash'

import CONSTANT from '../../../constant'
import { s3Crms as s3 } from '../../../utils'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    app.get('/projects/documents/download/:documentId', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const projectDocument = await app.service('projects/documents').get(req.params.documentId).catch(_e => {
            return res.status(400).send(new BadRequest('DOCUMENT_NOT_EXISTED'))
        })

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'companyId']
            }
        }).catch(_err => { return res.status(500).send(new GeneralError('USER_NOT_EXISTED')) })

        const project = await app.service('projects').get(projectDocument.projectId).catch(_e => {
            return res.status(400).send(new BadRequest('PROJECT_NOT_EXISTED'))
        })

        const { company } = rmsUser

        if (!company)
            res.status(500).send(new BadRequest('USER_NOT_ALLOWED'))

        if (_.intersection(rmsUser.user.role, CONSTANT.VALIDATE_ROLE_CRMS).length > 0 && project.companyId === company.id) {
            return s3.getObject({
                Bucket: CONSTANT.CRMS_BUCKET,
                Key: `${company.companyUrl}/client/other/${projectDocument.filePath}`
            }, async (err, data) => {
                if (err) return res.status(500).send(new BadRequest(err.message === 'The specified key does not exist.' ? 'FILE_NOT_EXISTED' : 'ERR_CONNECTION'))
                try {
                    fs.writeFileSync(projectDocument.fileOriginalName, data.Body)
                    res.download(projectDocument.fileOriginalName, () => {
                        fs.unlinkSync(projectDocument.fileOriginalName)
                    })
                } catch (_e) {
                    return true
                }
            })
        } else {
            return res.status(500).send(new BadRequest('USER_NOT_ALLOWED'))
        }
    })

    app.post('/projects/documents/upload', multer({}).array('files'), async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))
        if (!req.files) res.status(400).send(new BadRequest('FILE_NOT_EXISTED'))

        const project = await app.service('projects').get(req.body.projectId).catch(_err => res.status(400).send(new BadRequest('PROJECT_NOT_EXISTED')))
        const companies = await app.service('companies').get(project.companyId).catch(_e => { return null })

        const documentNames = JSON.parse(req.body.documentNames)
        req.files.forEach(async (file, index) => {
            if (!file) return
            let fileKey = `${file.originalname.split('.')[0]}-${md5(Date.now())}.${file.originalname.split('.').pop()}`
            let bucketKeyFolder = `${companies.companyUrl}/client/other/${fileKey}`
            s3.createBucket(() => {
                s3.upload({
                    Bucket: CONSTANT.CRMS_BUCKET,
                    Key: bucketKeyFolder,
                    Body: file.buffer
                }, async (err, _data) => {
                    if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))

                    await app.service('projects/documents').create({
                        projectId: project.id,
                        name: documentNames[index],
                        fileOriginalName: file.originalname,
                        filePath: fileKey
                    }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })
                })
            })
        })

        res.status(200).send({ state: true })
    })

    // Initialize our service with any options it requires
    app.use('/projects/documents', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('projects/documents')

    service.hooks(hooks)
}
