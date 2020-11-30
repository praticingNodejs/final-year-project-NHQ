// Initializes the `cms-advertisements` service on path `/cms/advertisements`
import createService from 'feathers-sequelize'
import createModel from '../../../models/cms/cms-advertisements.model'
import hooks from './cms-advertisements.hooks'

import JwtDecode from 'jwt-decode'
import { NotAuthenticated, GeneralError } from '@feathersjs/errors'
import md5 from 'md5'
import multer from 'multer'

import CONSTANT from '../../../constant'
import { s3Crms as s3 } from '../../../utils'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate')
    }

    app.post('/cms/ads/upload-image/:advertisementId', multer({}).single('file'), async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id']
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })

        const advertisement = await app.service('cms/ads').get(req.params.advertisementId).catch(_e => { return null })
        s3.createBucket(() => {
            const imagePath = `${md5(Date.now())}.${req.file.originalname.split('.').pop()}`
            s3.upload({
                client: s3,
                Bucket: CONSTANT.CRMS_BUCKET,
                Key: `arms/cms/ad/${imagePath}`,
                Body: req.file.buffer,
                ACL: 'public-read'
            }, async (err, _data) => {
                if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                await app.service('cms/ads').patch(advertisement.id, {
                    imagePath: imagePath
                }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })
                res.status(200).send(JSON.stringify({ state: true, imagePath }))
            })
        })
    })

    // Initialize our service with any options it requires
    app.use('/cms/ads', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('cms/ads')

    service.hooks(hooks)
}
