// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const usersAccessLogs = sequelizeClient.define('users_access_logs', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
        ipAddress: { type: DataTypes.STRING, field: 'ip_address' },
        browser: { type: DataTypes.STRING, field: 'browser' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    usersAccessLogs.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        usersAccessLogs.belongsTo(models.users, { foreignKey: 'userId', targetKey: 'id', as: 'user_id' })
    }

    return usersAccessLogs
}
