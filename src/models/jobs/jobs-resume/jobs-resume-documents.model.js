// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsResumeDocuments = sequelizeClient.define('jobs_resume_documents', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobsResumeId: { type: DataTypes.INTEGER, allowNull: false, field: 'jobs_resume_id' },
        documentPath: { type: DataTypes.STRING, field: 'document_path' },
        documentOriginalName: { type: DataTypes.STRING, field: 'document_original_name' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsResumeDocuments.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobsResumeDocuments.belongsTo(models.jobs_resume, { foreignKey: 'jobsResumeId', targetKey: 'id', as: 'jobsResume' })
    }

    return jobsResumeDocuments
}
