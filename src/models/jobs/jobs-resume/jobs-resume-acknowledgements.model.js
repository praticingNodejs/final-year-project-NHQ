// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsResumeAcknowledgements = sequelizeClient.define('jobs_resume_acknowledgements', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobsResumeId: { type: DataTypes.INTEGER, allowNull: false, field: 'jobs_resume_id' },
        projectName: { type: DataTypes.STRING, field: 'project_name' },
        website: { type: DataTypes.STRING, field: 'website' },
        position: { type: DataTypes.STRING, field: 'position' },
        jobLocation: { type: DataTypes.STRING, field: 'job_location' },
        availability: { type: DataTypes.STRING, field: 'availability' },
        typeOfHiring: { type: DataTypes.STRING, field: 'type_of_hiring' },
        contractPeriod: { type: DataTypes.STRING, field: 'contract_period' },
        currentSalary: { type: DataTypes.STRING, field: 'current_salary' },
        expectedSalary: { type: DataTypes.STRING, field: 'expected_salary' },
        otherComment: { type: DataTypes.STRING, field: 'other_comment' },
        emailMessage: { type: DataTypes.STRING, field: 'email_message' },
        sentAt: { type: DataTypes.DATE, field: 'sent_at' },
        otherBenefits: { type: DataTypes.STRING, field: 'other_benefits' },
        workWeekDay: { type: DataTypes.STRING, field: 'work_week_day' },
        workWeekHours: { type: DataTypes.STRING, field: 'work_week_hours' },
        showProjectInfo: { type: DataTypes.INTEGER, field: 'show_project_info' },
        importantNotes: { type: DataTypes.STRING, field: 'important_notes' },
        policy: { type: DataTypes.STRING, field: 'policy' },
        name: { type: DataTypes.STRING, field: 'name' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsResumeAcknowledgements.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobsResumeAcknowledgements.belongsTo(models.jobs_resume, { foreignKey: 'jobsResumeId', targetKey: 'id', as: 'jobs_resume_id' })
    }

    return jobsResumeAcknowledgements
}
