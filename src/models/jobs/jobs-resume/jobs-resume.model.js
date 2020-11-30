// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobResume = sequelizeClient.define('jobs_resume', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobId: { type: DataTypes.INTEGER, allowNull: false, field: 'job_id' },
        resumeId: { type: DataTypes.INTEGER, allowNull: false, field: 'resume_id' },
        resumePdfPath: { type: DataTypes.STRING, field: 'resume_pdf_path' },
        resumeName: { type: DataTypes.STRING, field: 'resume_name' },
        isBrandedFormat: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_branded_format' },
        isNominated: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_nominated' },
        status: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'status' },
        notification: { type: DataTypes.STRING, field: 'notification' },
        quotation: { type: DataTypes.STRING, field: 'quotation' },
        costing: { type: DataTypes.STRING, field: 'costing' },
        costingOriginalName: { type: DataTypes.STRING, field: 'costing_original_name' },
        email: { type: DataTypes.STRING, field: 'email' },
        consultantId: { type: DataTypes.UUID, field: 'consultant_id' },
        submittedOn: { type: DataTypes.DATE, field: 'submitted_on' },
        surveyReportPdf: { type: DataTypes.STRING, field: 'survey_report_pdf' },
        interviewDate: { type: DataTypes.DATE, field: 'interview_date' },
        interviewDuration: { type: DataTypes.INTEGER, field: 'interview_duration' },
        successDate: { type: DataTypes.DATE, field: 'success_date' },
        oldId: { type: DataTypes.INTEGER, field: 'old_id' },
        isApproved: { type: DataTypes.SMALLINT, defaultValue: 0, field: 'is_approved' },
        reviewStatus: { type: DataTypes.SMALLINT, field: 'review_status' },
        reviewedOn: { type: DataTypes.DATE, field: 'reviewed_on' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobResume.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobResume.belongsTo(models.jobs, { foreignKey: 'jobId', targetKey: 'id', as: 'jobs' })
        jobResume.belongsTo(models.resume, { foreignKey: 'resumeId', targetKey: 'id', as: 'resume' })
    }

    return jobResume
}
