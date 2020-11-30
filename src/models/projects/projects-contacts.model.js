// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
// eslint-disable-next-line no-unused-vars
import { Sequelize, DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const projectContacts = sequelizeClient.define('projects_contacts', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
        firstName: { type: DataTypes.STRING, field: 'first_name' },
        lastName: { type: DataTypes.STRING, field: 'last_name' },
        email: { type: DataTypes.STRING, field: 'email' },
        designation: { type: DataTypes.STRING, field: 'designation' },
        did: { type: DataTypes.STRING, field: 'did' },
        mobile: { type: DataTypes.STRING, field: 'mobile' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    projectContacts.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        projectContacts.belongsTo(models.projects, { foreignKey: 'projectId', targetKey: 'id', as: 'project_id' })
    }

    return projectContacts
}
