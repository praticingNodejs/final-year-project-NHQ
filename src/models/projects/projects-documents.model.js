// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const projectDocuments = sequelizeClient.define('projects_documents', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
        name: { type: DataTypes.STRING, field: 'name' },
        fileOriginalName: { type: DataTypes.STRING, field: 'file_original_name' },
        filePath: { type: DataTypes.STRING, field: 'file_path' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    projectDocuments.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        projectDocuments.belongsTo(models.projects, { foreignKey: 'projectId', targetKey: 'id', as: 'project_id' })
    }

    return projectDocuments
}
