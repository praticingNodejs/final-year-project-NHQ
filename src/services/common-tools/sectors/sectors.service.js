// Initializes the `sector` service on path `/sector`
import createService from 'feathers-sequelize'
import createModel from '../../../models/common-tools/sectors.model'
import hooks from './sectors.hooks'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['create', 'patch']
    }

    app.get('/sectors/public', async (req, res) => {
        const $limit = req.query.$limit ? req.query.$limit : 10
        const $sort = req.query.$sort || { id: 1 }

        const companySuspendedList = await app.service('companies').find({
            query: {
                status: 1,
                $select: ['id']
            },
            paginate: false
        }).then(result => {
            return result.map(({ id }) => id)
        }).catch(_e => { return [] })

        const sectorsListId = await app.service('jobs').find({
            query: {
                isActive: 1,
                showInPortal: true,
                companyId: {
                    $in: companySuspendedList
                },
                $select: ['sectorId'],
                $sort: {
                    sectorId: 1
                }
            },
            paginate: false
        }).then(result => {
            return result.map(({ sectorId }) => sectorId)
        }).catch(_e => {
            return []
        })

        const condition = {
            query: {
                id: {
                    $in: sectorsListId
                },
                status: 1,
                $select: ['id', 'name', 'icon'],
                $limit,
                $sort,
                $skip: req.query.$skip ? req.query.$skip : 0
            }
        }

        if (req.query.$limit) {
            if (req.query.$limit === '-1')
                condition.paginate = false
            else
                condition.query.$limit = req.query.$limit
        }

        const sectors = await app.service('sectors').find(condition).catch(_e => { return [] })
        return res.status(200).send(sectors)
    })

    // Initialize our service with any options it requires
    app.use('/sectors', createService(options))

    // Get our initialized service so that we can  register hooks
    const service = app.service('sectors')

    service.hooks(hooks)
}
