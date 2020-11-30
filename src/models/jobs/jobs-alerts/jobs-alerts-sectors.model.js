// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsAlertsSectors = sequelizeClient.define('jobs_alerts_sectors', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobsAlertsId: { type: DataTypes.INTEGER, field: 'jobs_alerts_id' },
        sectorId: { type: DataTypes.INTEGER, field: 'sector_id' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsAlertsSectors.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobsAlertsSectors.belongsTo(models.jobs_alerts, { foreignKey: 'jobsAlertsId', targetKey: 'id', as: 'jobsAlert' })
        jobsAlertsSectors.belongsTo(models.sectors, { foreignKey: 'sectorId', targetKey: 'id', as: 'sector' })
    }

    return jobsAlertsSectors
}
