// Initializes the `cms-single-content` service on path `/cms/single-content`
import createService from 'feathers-sequelize'
import createModel from '../../../models/cms/cms-single-content.model'
import hooks from './cms-single-content.hooks'

import multer from 'multer'
import JwtDecode from 'jwt-decode'
import { NotAuthenticated, GeneralError, BadRequest } from '@feathersjs/errors'
import md5 from 'md5'
import _ from 'lodash'

import CONSTANT from '../../../constant'
import { s3Crms as s3 } from '../../../utils'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    app.post('/cms/single-content/logo', multer({}).single('image'), async (req, res) => {
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
                $select: ['id', 'userId']
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })

        if (_.intersection(rmsUser.user?.role, CONSTANT.VALIDATE_ROLE_ARMS).length > 0) {
            return s3.createBucket(() => {
                const imagePath = `${md5(Date.now())}.${req.file.originalname.split('.').pop()}`
                return s3.upload({
                    client: s3,
                    Bucket: CONSTANT.CRMS_BUCKET,
                    Key: `arms/cms/ad/${imagePath}`,
                    Body: req.file.buffer,
                    ACL: 'public-read'
                }, async (err, _data) => {
                    if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                    await app.service('cms/single-content').patch('logo', {
                        content: imagePath,
                    }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })
                    return res.status(200).send(JSON.stringify({ state: true, imagePath }))
                })
            })
        } else {
            return res.status(400).send(new BadRequest('ROLE_NOT_ALLOWED'))
        }
    })

    // Initialize our service with any options it requires
    app.use('/cms/single-content', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('cms/single-content')

    service.hooks(hooks)
}
