// Initializes the `users` service on path `/users`
import createService from 'feathers-sequelize'
import createModel from '../../models/users/users.model'
import hooks from './users.hooks'

import { validationResult, query } from 'express-validator'
import { BadRequest, Forbidden, GeneralError, NotAuthenticated } from '@feathersjs/errors'
import md5 from 'md5'
import multer from 'multer'

import CONSTANT from '../../constant'
import { s3Js as s3, s3Crms } from '../../utils'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: {
            default: 10,
            max: 50
        }
    }

    app.get('/users/check-verify', [
        query('email').notEmpty().withMessage('EMAIL_IS_REQUIRED'),
        query('token').notEmpty().withMessage('TOKEN_IS_REQUIRED')
    ], async (req, res) => {
        const errors = await validationResult(req).errors
        if (errors.length > 0)
            return res.status(400).send(new BadRequest(errors[0].msg))

        const user = await app.service('users').findOne({
            query: {
                email: req.query.email
            }
        }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })

        if (user) {
            if (user.isVerified)
                return res.status(200).send({ isVerified: true })
            else
                return await user.verifyToken === req.query.token ?
                    res.status(200).send({ isVerified: false, isValidToken: true }) : res.status(200).send({ isVerified: false, isValidToken: false })
        }
        return res.status(403).send(new Forbidden('USER_NOT_EXISTED'))
    })

    app.get('/users/check-token', [
        query('token').notEmpty().withMessage('TOKEN_IS_REQUIRED')
    ], async (req, res) => {
        const errors = await validationResult(req).errors
        if (errors.length > 0)
            return res.status(400).send(new BadRequest(errors[0].msg))

        try {
            const user = await app.service('users').findOne({
                query: {
                    resetPasswordTokenUrl: req.query.token
                }
            }).catch(_e => { return null })

            if (!user) return res.status(403).send({ state: false, message: 'INVALID_TOKEN' })

            return new Date(user.resetExpires) >= new Date() ? res.status(200).send({ state: true }) : res.status(403).send({ state: false, message: 'TOKEN_IS_EXPIRED' })
        } catch (err) {
            return res.status(403).send({ state: false, message: 'INVALID_TOKEN' })
        }
    })

    app.get('/users/check-email', [
        query('email').notEmpty().withMessage('EMAIL_IS_REQUIRED')
    ], async (req, res) => {
        const errors = await validationResult(req).errors
        if (errors.length > 0)
            return res.status(400).send(new BadRequest(errors[0].msg))

        const user = await app.service('users').findOne({
            query: {
                email: req.query.email.toLowerCase()
            }
        }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })

        if (user) {
            return res.status(200).send({ state: true, msg: 'USER_EXISTED' })
            // switch (req.query.role) {
            //     case 'arms':
            //         if (_.intersection(CONSTANT.VALIDATE_ROLE_ARMS, user.role).length > 0) {
            //             return res.status(200).send({ state: true, msg: 'USER_EXISTED' })
            //         }
            //         break
            //     case 'crms':
            //         if (_.intersection(CONSTANT.VALIDATE_ROLE_CRMS, user.role).length > 0) {
            //             return res.status(200).send({ state: true, msg: 'USER_EXISTED' })
            //         }
            //         break
            //     case 'js':
            //         if (_.intersection(CONSTANT.VALIDATE_ROLE_JS, user.role).length > 0) {
            //             return res.status(200).send({ state: true, msg: 'USER_EXISTED' })
            //         }
            //         break
            //     default:
            //         return res.status(200).send({ state: false, msg: 'USER_NOT_EXISTED' })
            // }
        }
        return res.status(200).send({ state: false, msg: 'USER_NOT_EXISTED' })
    })

    app.post('/upload-avatar/:resumeId', multer({}).single('file'), async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))
        const resume = await app.service('resume').get(req.params.resumeId).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })

        let bucket = CONSTANT.BUCKET
        let key = CONSTANT.AVATAR_AWS_FOLDER
        if (resume.companyId) {
            bucket = CONSTANT.CRMS_BUCKET
            key = `${resume.company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}image/`
        }

        s3.createBucket(() => {
            const imagePath = `${md5(Date.now())}.${req.file.originalname.split('.').pop()}`
            s3.upload({
                client: s3,
                Bucket: bucket,
                Key: `${key}${imagePath}`,
                Body: req.file.buffer,
                ACL: 'public-read'
            }, async (err, _data) => {
                if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))

                await app.service('resume').patch(resume.id, {
                    photoPath: imagePath
                }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })

                if (!resume.companyId) {
                    const listResumeClone = await app.service('resume').find({
                        query: {
                            companyId: {
                                $ne: null
                            },
                            rootResumeId: req.params.resumeId,
                            $select: ['id', 'companyId', 'photoPath']
                        },
                        paginate: false
                    }).catch(_err => {
                        return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                    })

                    await app.service('resume').patch(null, {
                        photoPath: imagePath
                    }, {
                        query: {
                            id: {
                                $in: listResumeClone.map(({ id }) => id)
                            }
                        }
                    })

                    listResumeClone.map(async cloneResume => {
                        if (cloneResume.company.companyUrl)
                            await s3Crms.upload({
                                Bucket: CONSTANT.CRMS_BUCKET,
                                Key: `${cloneResume.company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}image/${imagePath}`,
                                Body: req.file.buffer,
                                ACL: 'public-read'
                            }).promise()
                    })
                }

                res.status(200).send(JSON.stringify({ state: true, imagePath }))
            })
        })
    })

    app.delete('/remove-avatar/:resumeId', async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))
        const resume = await app.service('resume').get(req.params.resumeId, {
            query: {
                $select: ['id', 'companyId', 'photoPath']
            }
        }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })

        let bucket = CONSTANT.BUCKET
        let key = CONSTANT.AVATAR_AWS_FOLDER

        if (resume.companyId) {
            bucket = CONSTANT.CRMS_BUCKET
            key = `${resume.company.companyUrl}${CONSTANT.RESUME_AWS_FOLDER}/image/`
        }

        if (resume.photoPath !== null)
            s3.deleteObject({
                Bucket: bucket,
                Key: `${key}${resume.photoPath}`
            }, async (err, _data) => {
                if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION', err))
                await app.service('resume').patch(resume.id, { photoPath: null }).catch(_err => {
                    return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                })
                res.status(200).send(JSON.stringify({ state: true }))
            })
    })

    app.get('/users/profile-views/:resumeId', async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        const sequelize = await app.get('sequelizeClient')
        const listCompanyId = await sequelize.query(`
            SELECT DISTINCT(rms.company_id) FROM jobs_resume_visitor AS jrv
            INNER JOIN rms_users_info AS rms
                ON rms.user_id = jrv.consultant_id
            WHERE jrv.is_seen = true AND jrv.portal_resume_id = ${req.params.resumeId}
        `).then(result => {
            return result[0].map(({ company_id }) => company_id)
        }).catch(_e => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })

        const listCompany = await app.service('companies').find({
            query: {
                id: {
                    $in: listCompanyId
                }
            },
            paginate: false
        }).catch(_e => { return [] })

        return res.status(200).send({ total: listCompany.length, data: listCompany })
    })

    // Initialize our service with any options it requires
    app.use('/users', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('users')

    service.hooks(hooks)
}
