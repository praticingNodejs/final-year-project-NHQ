// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize')
const DataTypes = Sequelize.DataTypes

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const seo = sequelizeClient.define('seo', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        name: { type: DataTypes.STRING, field: 'name' },
        type: { type: DataTypes.STRING, field: 'type' },
        status: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'status' },
        description: { type: DataTypes.STRING, fields: 'description' },
        abbreviation: { type: DataTypes.STRING, field: 'abbreviation' },
        companyId: { type: DataTypes.INTEGER, field: 'company_id' },
        addedByCRMS: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'added_by_crms' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    seo.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return seo
}
