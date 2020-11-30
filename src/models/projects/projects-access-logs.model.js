// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const projectsAccessLogs = sequelizeClient.define('projects_access_logs', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        userId: { type: DataTypes.UUID, field: 'user_id' },
        companyId: { type: DataTypes.INTEGER, field: 'company_id' },
        remarks: { type: DataTypes.STRING, field: 'remarks' },
        isCancel: { type: DataTypes.SMALLINT, defaultValue: 0, field: 'is_cancel' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    projectsAccessLogs.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        projectsAccessLogs.belongsTo(models.users, { foreignKey: 'userId', targetKey: 'id', as: 'users' })
    }

    return projectsAccessLogs
}
