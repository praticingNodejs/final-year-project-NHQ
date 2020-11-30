// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsResumeVisitor = sequelizeClient.define('jobs_resume_visitor', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobsResumeId: { type: DataTypes.INTEGER, field: 'jobs_resume_id' },
        remarks: { type: DataTypes.STRING, field: 'remarks' },
        portalResumeId: { type: DataTypes.INTEGER, field: 'portal_resume_id' },
        recruiterResumeId: { type: DataTypes.INTEGER, field: 'recruiter_resume_id' },
        consultantId: { type: DataTypes.UUID, allowNull: false, field: 'consultant_id' },
        isSeen: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_seen' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsResumeVisitor.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return jobsResumeVisitor
}
