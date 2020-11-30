// Initializes the `companies` service on path `/companies`
import createService from 'feathers-sequelize'
import createModel from '../../models/companies/companies.model'
import hooks from './companies.hooks'

import { NotAuthenticated, GeneralError, BadRequest } from '@feathersjs/errors'
import multer from 'multer'
import md5 from 'md5'
import { scheduleJob } from 'node-schedule'

import CONSTANT from '../../constant'
import { s3Crms as s3 } from '../../utils'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['patch']
    }

    app.get('/companies/public', async (req, res) => {
        const companyListId = await app.service('jobs').find({
            query: {
                isActive: 1,
                showInPortal: true,
                $select: ['companyId']
            },
            paginate: false
        }).then(result => {
            return result.map(({ companyId }) => companyId)
        }).catch(_e => { return [] })

        const $limit = req.query.$limit ? req.query.$limit : 10
        const $sort = req.query.$sort || { id: 1 }

        const condition = {
            query: {
                id: {
                    $in: companyListId
                },
                status: 1,
                $limit,
                $skip: req.query.$skip ? req.query.$skip : 0,
                $sort,
                $select: [
                    'id',
                    'name',
                    'website',
                    'dataProtection',
                    'businessTerm',
                    'country',
                    'createdAt',
                    'primaryName',
                    'primaryUserId',
                    'imagePath',
                    'isFeatured',
                    'description',
                    'companyUrl',
                    'contact',
                    'nationality',
                    'residentialStatus'
                ]
            }
        }

        if (req.query.$limit) {
            if (req.query.$limit === '-1')
                condition.paginate = false
            else
                condition.query.$limit = req.query.$limit
        }

        const companyList = await app.service('companies').find(condition).catch(_e => { return [] })

        return res.status(200).send(companyList)
    })

    app.post('/companies/upload-image/:companyId', multer({}).single('file'), async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))
        const company = await app.service('companies').get(req.params.companyId).catch(_err => { return res.status(400).send(new BadRequest('COMPANY_NOT_EXISTED')) })
        s3.createBucket(() => {
            const imagePath = `${md5(Date.now())}.${req.file.originalname.split('.').pop()}`
            s3.upload({
                client: s3,
                Bucket: CONSTANT.CRMS_BUCKET,
                Key: `${company.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${imagePath}`,
                Body: req.file.buffer,
                ACL: 'public-read'
            }, async (err, _data) => {
                if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                await app.service('companies').patch(company.id, {
                    imagePath: imagePath
                }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })
                return res.status(200).send(JSON.stringify({ state: true, imagePath }))
            })
        })
    })

    // auto suspense outdated companies
    function setSchedule() {
        // schedule will start at 0am each day
        return scheduleJob('0 0 0 * * *', () => {
            app.service('companies').patch(null, {
                status: 0
            }, {
                query: {
                    subscriptionEndDate: {
                        $lt: new Date()
                    }
                }
            }).catch(_e => {
                return null
            })
        })
    }

    // auto renew portal date every day
    function autoReNewPortalDate () {
        return scheduleJob('0 0 0 * * *', async () => {
            const sequelize = await app.get('sequelizeClient')
            // count the total job match condition to renew
            const totalJob = await sequelize.query(`
                SELECT COUNT(jobs.id) FROM jobs
                JOIN companies ON jobs."companyId" = companies.id
                WHERE
                    jobs."statusId" = 239 -- status open
                    AND jobs."isActive" = 1
                    AND companies.status = 1
            `).then(result => {
                return parseInt(result[0][0].count, 10)
            }).catch(_err => { return null })

            if(totalJob) {
                // select all companies that have active and portalDateFrequency
                const activeCompanies = await app.service('companies').find({
                    query: {
                        status: 1,
                        portalDateFrequency: {
                            $ne: null
                        },
                        $select: ['id']
                    },
                    paginate: false
                }).then(result => {
                    return result.map(({ id }) => id)
                }).catch(_e => { return [] })

                //* sequence process, each time 100 elements
                const limit = 100
                let skip = 0

                while (skip < totalJob) {
                    // select job in pre-list companies - limit for sequence process
                    const jobList = await app.service('jobs').find({
                        query: {
                            isActive: 1,
                            statusId: 239, // open job
                            companyId: {
                                $in: activeCompanies
                            },
                            $sort: {
                                id: 1
                            },
                            $limit: limit,
                            $skip: skip,
                            $select: ['id', 'portalDate', 'companyId']
                        },
                        paginate: false
                    }).catch(_err => { return [] })

                    //* sequence process, each time 100 elements
                    jobList.map(job => {
                        // num of sec
                        const dateDiff = Math.floor((new Date().getTime() - new Date(job.portalDate).getTime()) / (24 * 60 * 60 * 1000))
                        // portalDate is count by day -> convert to sec
                        const portalDateFrequency = job.company.portalDateFrequency

                        // if dateDiff is more than or equal portalDate, auto renew
                        if (dateDiff >= portalDateFrequency) {
                            app.service('jobs').patch(job.id, {
                                portalDate: new Date()
                            }).catch(_e => { return true })
                        }
                    })

                    skip += limit
                }
            }
        })
    }

    setSchedule()
    autoReNewPortalDate()

    // Initialize our service with any options it requires
    app.use('/companies', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('companies')

    service.hooks(hooks)
}
