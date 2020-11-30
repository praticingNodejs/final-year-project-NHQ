// Initializes the `cms-banner` service on path `/cms/banner`
import createService from 'feathers-sequelize'
import createModel from '../../../models/cms/cms-banner.model'
import hooks from './cms-banner.hooks'

import JwtDecode from 'jwt-decode'
import { NotAuthenticated, GeneralError, BadRequest } from '@feathersjs/errors'
import md5 from 'md5'
import multer from 'multer'
import _ from 'lodash'
import { scheduleJob } from 'node-schedule'

import CONSTANT from '../../../constant'
import { s3Crms as s3 } from '../../../utils'


export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['patch']
    }

    app.post('/cms/banner/upload-image/:bannerId', multer({}).single('file'), async (req, res) => {
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
                    await app.service('cms/banner').patch(req.params.bannerId, {
                        imagePath,
                    }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })
                    return res.status(200).send(JSON.stringify({ state: true, imagePath }))
                })
            })
        } else {
            return res.status(400).send(new BadRequest('ROLE_NOT_ALLOWED'))
        }
    })

    function setSchedule() {
        // schedule will start at 0am each day
        return scheduleJob('0 0 0 * * *', () => {
            app.service('cms/banner').patch(null, {
                isActive: 0
            }, {
                query: {
                    endDate: {
                        $lt: new Date()
                    }
                }
            }).catch(_e => {
                return null
            })
        })
    }

    setSchedule()

    // Initialize our service with any options it requires
    app.use('/cms/banner', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('cms/banner')

    service.hooks(hooks)
}
