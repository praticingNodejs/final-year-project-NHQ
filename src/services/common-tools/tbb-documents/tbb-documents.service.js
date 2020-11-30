/* eslint-disable no-extra-boolean-cast */
// Initializes the `tbb-document` service on path `/tbb-document`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/tbb-documents.model'
import hooks from './tbb-documents.hooks'

import fs from 'fs'
import JwtDecode from 'jwt-decode'
import { GeneralError, NotAuthenticated, BadRequest } from '@feathersjs/errors'
import md5 from 'md5'
import multer from 'multer'

import CONSTANT from '../../../constant'
import { s3Crms as s3 } from '../../../utils'

export default function (app) {
    const options = {
        Model: createModel(app),
        multi: ['remove']
    }

    app.post('/tbb-documents/upload/:tbbId', multer({}).single('file'), async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        if (!!!req.body.documentName)
            return res.status(400).send(new BadRequest('MISSING_REQUIRED_FIELD'))

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'companyId']
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })

        const tbbDocs = await app.service('tbb-documents').get(req.params.tbbId).catch(_err => { return res.status(400).send(new BadRequest('TBB_DOCUMENTS_NOT_EXISTED')) })

        s3.createBucket(() => {
            const tbbPath = `${req.file.originalname.split('.')[0]}_${md5(Date.now())}.${req.file.originalname.split('.').pop()}`
            const pathS3 = rmsUser.company ? rmsUser.company.companyUrl : 'arms'
            s3.upload({
                client: s3,
                Bucket: CONSTANT.CRMS_BUCKET,
                Key: `${pathS3}/tbbdocument/${tbbPath}`,
                Body: req.file.buffer
            }, async (err, _data) => {
                if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))

                await app.service('tbb-documents').patch(tbbDocs.id, {
                    documentName: req.body.documentName,
                    documentPath: tbbPath,
                    documentOriginalFileName: req.file.originalname
                }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })
                res.status(200).send(JSON.stringify({ state: true, tbbPath }))
            })
        })
    })

    app.get('/tbb-documents/upload/:tbbId', async (req, res) => {
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
                $select: ['id', 'userId', 'companyId']
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })

        const tbbDocs = await app.service('tbb-documents').get(req.params.tbbId).catch(_err => { res.status(400).send(new BadRequest('TBB_DOCUMENTS_NOT_EXISTED')) })
        const pathS3 = rmsUser.company ? rmsUser.company.companyUrl : 'arms'

        s3.getObject({
            Bucket: CONSTANT.CRMS_BUCKET,
            Key: `${pathS3}/tbbdocument/${tbbDocs.documentPath}`
        }, async (err, data) => {
            if (err) return res.status(500).send(new GeneralError('FILE_NOT_EXISTED'))
            try {
                fs.writeFileSync(tbbDocs.documentOriginalFileName, data.Body)
                res.download(tbbDocs.documentOriginalFileName, () => {
                    fs.unlinkSync(tbbDocs.documentOriginalFileName)
                })
            } catch (_e) {
                return true
            }
        })

    })

    // add ltree to postgres
    // CREATE extension ltree;
    // alter table tbb_documents alter column folder_path type ltree using folder_path::ltree
    // CREATE INDEX path_idx ON tbb_documents USING BTREE (folder_path);
    // CREATE INDEX path_gist_idx ON tbb_documents USING GIST (folder_path);
    app.get('/tbb-documents/search', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'companyId']
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })

        const sequelize = app.get('sequelizeClient')
        sequelize.query(`
            SELECT id
                ,document_name as "documentName"
                ,document_file_path as "documentFilePath"
                ,document_original_file_name as "documentOriginalFileName"
                ,company_id as "companyId"
                ,folder_name as "folderName"
                ,folder_path as "folderPath"
                ,is_root_folder as "isRootFolder"
                ,created_at as "createdAt"
            FROM tbb_documents
            WHERE
                subltree(folder_path, 0, ${req.query.path.split('.').length}) <@ '${req.query.path}'
        `).then(r => {
            return res.status(200).send(r[0])
        }).catch(_err => {
            return res.status(500).send(new GeneralError('ERR_CONNECTION'))
        })
    })

    // Initialize our service with any options it requires
    app.use('/tbb-documents', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('tbb-documents')

    service.hooks(hooks)
}
