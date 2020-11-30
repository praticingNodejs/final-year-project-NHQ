// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsCoowners = sequelizeClient.define('jobs_coowners', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobId: { type: DataTypes.INTEGER, allowNull: false, field: 'job_id' },
        consultantId: { type: DataTypes.UUID, allowNull: false, field: 'consultant_id' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsCoowners.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobsCoowners.belongsTo(models.users, { foreignKey: 'consultantId', targetKey: 'id', as: 'consultant_id' })
        jobsCoowners.belongsTo(models.jobs, { foreignKey: 'jobId', targetKey: 'id', as: 'job_id' })
    }

    return jobsCoowners
}
