// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'


export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsUpdatedLogs = sequelizeClient.define('jobs_updated_logs', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobId: { type: DataTypes.INTEGER, allowNull: false, field: 'job_id' },
        change: { type: DataTypes.INTEGER, field: 'change' },
        remark: { type: DataTypes.STRING, field: 'remark' },
        newStatus: { type: DataTypes.STRING, field: 'new_status' },
        newJobStatusId: { type: DataTypes.STRING, field: 'new_job_status_id' },
        assignedTo: { type: DataTypes.STRING, field: 'assigned_to' },
        updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsUpdatedLogs.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobsUpdatedLogs.belongsTo(models.jobs, { foreignKey: 'jobId', targetKey: 'id', as: 'jobs' })
        jobsUpdatedLogs.belongsTo(models.job_statuses, { foreignKey: 'newJobStatusId', targetKey: 'id', as: 'new_job_status_id' })
    }

    return jobsUpdatedLogs
}
