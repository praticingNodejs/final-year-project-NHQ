// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsProjectContacts = sequelizeClient.define('jobs_project_contacts', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        jobId: { type: DataTypes.INTEGER, allowNull: false, field: 'job_id' },
        projectContactId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_contact_id' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsProjectContacts.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobsProjectContacts.belongsTo(models.jobs, { foreignKey: 'jobId', targetKey: 'id', as: 'job_id' })
        // jobsProjectContacts.belongsTo(models.projects_contacts, { foreignKey: 'projectContactId', targetKey: 'id', as: 'project_contact_id' })
    }

    return jobsProjectContacts
}
