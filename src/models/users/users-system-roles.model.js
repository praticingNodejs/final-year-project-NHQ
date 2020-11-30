// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const usersSystemRoles = sequelizeClient.define('users_system_roles', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
        systemRoleId: { type: DataTypes.INTEGER, allowNull: false, field: 'system_role_id', defaultValue: 2 },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    usersSystemRoles.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        usersSystemRoles.belongsTo(models.users, { foreignKey: 'userId', targetKey: 'id', as: 'user_id' })
        usersSystemRoles.belongsTo(models.system_roles, { foreignKey: 'systemRoleId', targetKey: 'id', as: 'role' })
    }

    return usersSystemRoles
}
