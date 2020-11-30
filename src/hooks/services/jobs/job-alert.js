// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
// eslint-disable-next-line no-unused-vars
export const removeJobAlert = (options = {}) => {
    return async context => {
        if (context.params.query.id) {
            const { id } = context.params.query
            const query = {
                jobsAlertsId: Array.isArray(id.$in) ? {
                    $in: id.$in
                } : id
            }

            context.app.service('jobs/alerts/positions').remove(null, { query })
            context.app.service('jobs/alerts/sectors').remove(null, { query })
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const createJobAlerts = (options = {}) => {
    return async context => {
        // Create job alert sector
        context.result.sectors = []
        context.result.positions = []

        for (const sector of context.data.sectors) {
            await context.app.service('jobs/alerts/sectors').create({
                sectorId: sector,
                jobsAlertsId: context.result.id
            }).then(result => { context.result.sectors.push(result) })
        }
        for (const position of context.data.positions) {
            await context.app.service('jobs/alerts/positions').create({
                position: position,
                jobsAlertsId: context.result.id
            }).then(result => { context.result.positions.push(result) })
        }

        return context
    }
}
