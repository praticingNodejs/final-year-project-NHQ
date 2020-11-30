// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsResumeInterview = sequelizeClient.define('jobs_resume_interview', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobsResumeId: { type: DataTypes.INTEGER, allowNull: false, field: 'jobs_resume_id' },
        interviewDate: { type: DataTypes.DATE, field: 'interview_date' },
        interviewDuration: { type: DataTypes.INTEGER, field: 'interview_duration' },
        jobLocation: { type: DataTypes.STRING, field: 'job_location' },
        weekWorkHours: { type: DataTypes.STRING, field: 'week_work_hours' },
        typeOfHire: { type: DataTypes.STRING, field: 'type_of_hire' },
        expectedSalary: { type: DataTypes.STRING, field: 'expected_salary' },
        availability: { type: DataTypes.STRING, field: 'availability' },
        personName: { type: DataTypes.STRING, field: 'person_name' },
        personDesignation: { type: DataTypes.STRING, field: 'person_designation' },
        personTel: { type: DataTypes.STRING, field: 'person_tel' },
        interviewerName: { type: DataTypes.STRING, field: 'interviewer_name' },
        interviewerDesignation: { type: DataTypes.STRING, field: 'interviewer_designation' },
        interviewerTel: { type: DataTypes.STRING, field: 'interviewer_tel' },
        remarks: { type: DataTypes.STRING, field: 'remarks' },
        address: { type: DataTypes.STRING, field: 'address' },
        docsNeeded: { type: DataTypes.STRING, field: 'docs_needed' },
        interviewMode: { type: DataTypes.INTEGER, field: 'interview_mode' },
        tips: { type: DataTypes.STRING, field: 'tips' },
        jobResponsibility: { type: DataTypes.STRING, field: 'job_responsibility' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsResumeInterview.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return jobsResumeInterview
}
