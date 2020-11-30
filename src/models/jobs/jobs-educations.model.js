// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsEducation = sequelizeClient.define('jobs_educations', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobId: { type: DataTypes.INTEGER, allowNull: false, field: 'job_id' },
        educationId: { type: DataTypes.INTEGER, allowNull: false, field: 'education_id' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsEducation.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobsEducation.belongsTo(models.jobs, { foreignKey: 'jobId', targetKey: 'id', as: 'job_id' })
        jobsEducation.belongsTo(models.educations, { foreignKey: 'educationId', targetKey: 'id', as: 'education_id' })
    }

    return jobsEducation
}
