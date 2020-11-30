// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const locationsSub = sequelizeClient.define('locations_sub', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        name: { type: DataTypes.STRING, field: 'name' },
        status: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'status' },
        description: { type: DataTypes.STRING, fields: 'description' },
        locationId: { type: DataTypes.INTEGER, allowNull: false, field: 'location_id' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    locationsSub.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return locationsSub
}
