// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsAlertsPositions = sequelizeClient.define('jobs_alerts_positions', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobsAlertsId: { type: DataTypes.INTEGER, field: 'jobs_alerts_id' },
        position: { type: DataTypes.STRING, field: 'position' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsAlertsPositions.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobsAlertsPositions.belongsTo(models.jobs_alerts, { foreignKey: 'jobsAlertsId', targetKey: 'id', as: 'jobsAlert' })
    }

    return jobsAlertsPositions
}
