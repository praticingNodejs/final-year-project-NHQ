// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const systemRoles = sequelizeClient.define('system_roles', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        name: { type: DataTypes.STRING, field: 'name', unique: true },
        isActive: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'is_active' },
        abbreviation: { type: DataTypes.STRING, field: 'abbreviation' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    systemRoles.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return systemRoles
}
