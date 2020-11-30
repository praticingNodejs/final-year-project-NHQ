import { authenticate } from '@feathersjs/authentication'
import { iff, isProvider, fastJoin, disallow } from 'feathers-hooks-common'

import * as apiHook from '../../../hooks'

const jobsAlertExternal = {
    joins: {
        alertSectors: (..._args) => async (jobsAlerts, context) => jobsAlerts.alertSectors = await context.app.service('jobs/alerts/sectors').find({
            query: {
                jobsAlertsId: jobsAlerts.id,
                $select: ['id', 'sectorId']
            },
            paginate: false
        }).then(result => {
            return result.map(obj => {
                return {
                    id: obj.id,
                    sectorId: obj.sector?.id,
                    name: obj.sector?.name
                }
            })
        }).catch(_e => { return null }),
        alertPositions: (..._args) => async (jobsAlerts, context) => jobsAlerts.alertPositions = await context.app.service('jobs/alerts/positions').find({
            query: {
                jobsAlertsId: jobsAlerts.id
            },
            paginate: false
        }).catch(_e => { return null })
    }
}

export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [disallow('external')],
        patch: [iff(isProvider('external'), authenticate('jwt'))],
        remove: [
            iff(
                isProvider('external'),
                apiHook.multiCRUD()
            ),
            apiHook.removeJobAlert()
        ]
    },

    after: {
        all: [iff(isProvider('external'), fastJoin(jobsAlertExternal))],
        find: [],
        get: [],
        create: [apiHook.createJobAlerts()],
        update: [],
        patch: [],
        remove: []
    },

    error: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
    }
}
