// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const locations = sequelizeClient.define('locations', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        name: { type: DataTypes.STRING, field: 'name' },
        status: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'status' },
        description: { type: DataTypes.STRING, fields: 'description' },
        abbreviation: { type: DataTypes.STRING, field: 'abbreviation' },
        companyId: { type: DataTypes.INTEGER, field: 'company_id' },
        addedByCRMS: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'added_by_crms' },
        dialingCode: { type: DataTypes.STRING, field: 'dialing_code' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    locations.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        locations.hasMany(models.companies, { foreignKey: 'country', targetKey: 'id', as: 'location' })
    }

    return locations
}
