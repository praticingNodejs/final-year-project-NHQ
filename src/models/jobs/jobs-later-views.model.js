// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsLaterViews = sequelizeClient.define('jobs_later_views', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
        jobId: { type: DataTypes.INTEGER, allowNull: false, field: 'job_id' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsLaterViews.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobsLaterViews.belongsTo(models.users, { foreignKey: 'userId', targetKey: 'id', as: 'user_id' })
        jobsLaterViews.belongsTo(models.jobs, { foreignKey: 'jobId', targetKey: 'id', as: 'job_id' })
    }

    return jobsLaterViews
}
