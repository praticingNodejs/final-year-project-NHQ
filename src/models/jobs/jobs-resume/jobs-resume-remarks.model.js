// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsResumeRemarks = sequelizeClient.define('jobs_resume_remarks', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobsResumeId: { type: DataTypes.INTEGER, allowNull: false, field: 'jobs_resume_id' },
        jobsResumeStatus: { type: DataTypes.INTEGER, field: 'jobs_resume_status' },
        remark: { type: DataTypes.STRING, field: 'remark' },
        interviewDateRemark: { type: DataTypes.STRING, field: 'interview_date_remark' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsResumeRemarks.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobsResumeRemarks.belongsTo(models.jobs_resume, { foreignKey: 'jobsResumeId', targetKey: 'id', as: 'jobs_resume_id' })
    }

    return jobsResumeRemarks
}
