// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const companiesDesignations = sequelizeClient.define('companies_designations', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        status: { type: DataTypes.SMALLINT, field: 'status' },
        designationId: { type: DataTypes.INTEGER, allowNull: false, field: 'designation_id' },
        companyId: { type: DataTypes.INTEGER, field: 'company_id' },
        addedByCRMS: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'added_by_crms' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    companiesDesignations.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        companiesDesignations.belongsTo(models.companies, { foreignKey: 'companyId', targetKey: 'id', as: 'company' })
        companiesDesignations.belongsTo(models.designations, { foreignKey: 'designationId', targetKey: 'id', as: 'designation' })
    }

    return companiesDesignations
}
